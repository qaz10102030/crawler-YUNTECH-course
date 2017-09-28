var webdriver = require('selenium-webdriver'),By = webdriver.By,until = webdriver.until;
var fs = require('fs');
var cheerio = require("cheerio");
var driver = new webdriver.Builder().forBrowser('chrome').build(); //建瀏覽器
const depart = ["工程學院","管理學院","設計學院","人文與科學學院"];
var mongodb = require('mongodb');
var mongodbServer = new mongodb.Server('localhost', 27017, {
  auto_reconnect: true,
  poolSize: 10
});
var db = new mongodb.Db('yuntech', mongodbServer);
var depart_num = 0;
process.setMaxListeners(0);
//可調整變數區
var proc_timeout = 300000; //整個爬蟲程序的時間，依效能調整
var year = 106;//學年
var semester = 1; //學期
//
driver.get('https://webapp.yuntech.edu.tw/WebNewCAS/Course/QueryCour.aspx'); //前往
driver.wait(until.titleIs('國立雲林科技大學 YunTech -- 教務資訊系統 - 課程資訊查詢 Course Information'), 15000); //等頁面載完
driver.findElement(By.id("ctl00_ContentPlaceHolder1_AcadSeme")).click(); //點學院清單
driver.findElement(By.xpath("//*[.=\""+ year + "學年第" + semester + "學期" +"\"]")).click(); //選一個
driver.wait(function(){
    while(depart_num < 4){
        deaprtment(depart_num);
        depart_num++;
    }
    return true;
},proc_timeout);

driver.quit();

//一個學院要做的事
function deaprtment(select){
    driver.findElement(By.id("ctl00_ContentPlaceHolder1_College")).click(); //點學院清單
    driver.findElement(By.xpath("//*[.=\""+ depart[select] +"\"]")).click(); //選一個
    driver.wait(until.elementIsNotVisible(driver.findElement(By.id('ctl00_UpdateProg1'))),10000); //等待處理中的畫面消失
    driver.findElement(By.id("ctl00_ContentPlaceHolder1_Submit")).click(); //點送出
    driver.wait(until.titleIs('國立雲林科技大學 YunTech -- 教務資訊系統 - 課程資訊查詢 Course Information'), 5000);//等頁面載完
    driver.findElement(By.id("ctl00_ContentPlaceHolder1_PageControl1_PageSize")).click(); //點最大筆數清單
    driver.findElement(By.xpath("//*[.=\"100\"]")).click(); //選100筆
    driver.wait(until.elementIsNotVisible(driver.findElement(By.id('ctl00_UpdateProg1'))),10000); //等待處理中的畫面消失(100筆等久一點)
    parse_html_and_analysis();
    var total_page = 0; //建立臨時變數存課程總頁數
    driver.findElement(By.id('ctl00_ContentPlaceHolder1_PageControl1_TotalPage')).getText().then(function(s) { //取人數，異步處理所以要function
        console.log(s);
        total_page = s - 1; //替換
    });
    driver.wait(function(){ //等待頁數被存起來
        return (total_page != 0)
    },3000);
    
    driver.wait(function(){
        while(total_page--){
            driver.findElement(By.id("ctl00_ContentPlaceHolder1_PageControl1_NextPage")).click(); //換頁
            driver.wait(until.elementIsNotVisible(driver.findElement(By.id('ctl00_UpdateProg1'))),10000).then(function(){
                parse_html_and_analysis(depart[select]);
            });
        }
        return true;
    },50000);
    driver.get('https://webapp.yuntech.edu.tw/WebNewCAS/Course/QueryCour.aspx'); //前往
    driver.wait(until.titleIs('國立雲林科技大學 YunTech -- 教務資訊系統 - 課程資訊查詢 Course Information'), 15000); //等頁面載完
}

//一頁要做的事
function parse_html_and_analysis(select){
    var isAnalysising = false;
    //取html
    driver.findElement(By.id('ctl00_ContentPlaceHolder1_UpdatePanel3')).getAttribute("innerHTML")
        .then(function(profile) {
            fs.writeFile('./data/' + select + 'HTML.txt', profile, (err) => { //存起乃
                if (err) throw err;
                console.log('HTML saved!');
            });
            isAnalysising = true;
            analysis(profile,select);
            isAnalysising = false;            
    });
    driver.wait(function(){
        return !(isAnalysising);
    },10000);
}

//分析html的function
function analysis(profile,select){
    var $ = cheerio.load(profile); //把文本塞給cheerio
    var read = []; //開個陣列暫存
    $('.GridView_General tbody tr').each(function(i, elem){ //取表格將資料切出來
        read.push($(this).text().split('\n'));
    });
    
    fs.writeFile('./data/' + select + 'parse_first.txt', read , (err) => { //再存存~
        if (err) throw err;
        console.log('parse_first saved!');
    });
    
    var output = []; //開陣列放最後處理完的資料
    
    for(var i=1 ; i<read.length-2 ; i++){ //開始取
        var parse_day = read[i][20].trim().split('-')[0];
        var parse_sc_room = read[i][20].trim().split('-')[1];
        if(parse_sc_room != undefined)
        {
            var parse_schedule = new String(parse_sc_room).split('/')[0];
            var parse_room = new String(parse_sc_room).split('/')[1];
        }else{
            var parse_schedule = "";
            var parse_room = "";
        }
    
        output.push({
            serial : read[i][2].trim(),
            curriculum : read[i][4].trim(),
            name : read[i][6].trim(),
            name_eng : read[i][8].trim(),
            class : read[i][10].trim(),
            team : read[i][11].trim(),
            require : read[i][14].trim(),
            require_eng : read[i][16].trim(),
            credits : read[i][18].trim(),
            day : parse_day,
            schedule : parse_schedule,
            room : parse_room,
            teacher : read[i][22].trim(),
            num_people : read[i][24].trim(),
            num_people_limit : read[i][26].trim()
        });
    }
        
    fs.writeFile('./data/' + select + 'output.txt', JSON.stringify(output) , (err) => { //再再存存~~
        if (err) throw err;
        console.log('output saved!');
    });
    
    insertToDB(output);
}

function insertToDB(data){
    db.open(function() {
        /*
        * InsertMany測試 
        */
        /*
        console.time("InsertMany time");
        db.collection('course').insertMany(data, function(err, res) {
        if (res) {
            console.timeEnd("InsertMany time");
        } else {
            console.log("insert error");
        }
        });
        */

        /*
        * Ordered Bulk Insert 測試 
        */
        
        console.time("Bulk Insert");
        var bulk = db.collection('course').initializeOrderedBulkOp();
        for (var i = 0; i < data.length; i++) {
            bulk.insert(data[i]);
        }
        bulk.execute(function(err,res){
            console.timeEnd("Bulk Insert");
            db.close();
        });        
    });            
}
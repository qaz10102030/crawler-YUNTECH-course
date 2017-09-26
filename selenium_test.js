var webdriver = require('selenium-webdriver'),
By = webdriver.By,
until = webdriver.until;
var fs = require('fs');
var main = require('./main.js');

var driver = new webdriver.Builder()
    .forBrowser('chrome')
    .build()

driver.get('https://webapp.yuntech.edu.tw/WebNewCAS/Course/QueryCour.aspx');
driver.wait(until.titleIs('國立雲林科技大學 YunTech -- 教務資訊系統 - 課程資訊查詢 Course Information'), 1000);
driver.findElement(By.id("ctl00_ContentPlaceHolder1_College")).click();
driver.findElement(By.xpath("//*[.=\"工程學院\"]")).click();
driver.wait(until.elementIsNotVisible(driver.findElement(By.id('ctl00_UpdateProg1'))),3000);
driver.findElement(By.id("ctl00_ContentPlaceHolder1_Submit")).click();
driver.wait(until.titleIs('國立雲林科技大學 YunTech -- 教務資訊系統 - 課程資訊查詢 Course Information'), 5000);

driver.findElement(By.id('ctl00_ContentPlaceHolder1_UpdatePanel3')).getAttribute("innerHTML")
    .then(function(profile) {
        driver.quit();
        fs.writeFile('message.txt', profile, (err) => {
            if (err) throw err;
            console.log('It\'s saved!');
        });
        //main.analysis(profile);
    });
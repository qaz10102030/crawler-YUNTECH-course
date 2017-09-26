var cheerio = require("cheerio");

/*暫時讀檔*/
var fs = require('fs');

exports.analysis = function (profile){
  var $ = cheerio.load(profile);
  var a = $.attr('class','GridView_Row');
}
var read = [];
var temp = fs.readFileSync('./message.txt','utf8');
var $ = cheerio.load(temp);
$('.GridView_General tbody tr').each(function(i, elem){
  read.push($(this).text().split('\n'));
});

//console.log(read);
fs.writeFile('test.txt', read , (err) => {
  if (err) throw err;
  console.log('It\'s saved!');
});

var output = [];

for(var i=1 ; i<read.length-2 ; i++){
    var parse_day = read[i][20].trim().split('-')[0];
    var parse_sc_room = read[i][20].trim().split('-')[1];
    var parse_schedule = new String(parse_sc_room).split('/')[0];
    var parse_room = new String(parse_sc_room).split('/')[1];
    
    output.push({
       serial : read[i][2].trim(),
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
       num_people : read[i][26].trim()
    });
}
 
console.log(JSON.stringify(output));
fs.writeFile('output.txt', JSON.stringify(output) , (err) => {
  if (err) throw err;
  console.log('It\'s saved!');
});
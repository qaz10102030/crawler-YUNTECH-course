var csv = require('csv');
var tsv = require('tsv');
var fs = require('fs');

//read tsv
var read_tsv = fs.readFileSync('./105學年度-場地借用狀況 - 1060619-1060625.tsv','utf8');

var parse_tsv = tsv.parse(read_tsv);
console.log(read_tsv);

fs.writeFile('parse_tsv.txt', JSON.stringify(parse_tsv) , (err) => {
    if (err) throw err;
    console.log('It\'s saved!');
});
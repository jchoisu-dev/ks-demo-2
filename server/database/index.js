const mongoose = require("mongoose");
const fs = require('fs');
const path = require('path');
const _path = './models';
const exp = {};
const files = fs.readdirSync(path.join(__dirname, _path));
for (const i in files) {
    const fileName = files[i].replace(/\.js/i, '');
    const parameter = require(_path + '/' + fileName);
    const file = fileName.replace(/\_/g, '').toUpperCase();
    exp[file] = mongoose.model(fileName, parameter);
}
console.log(exp);
module.exports = { ...exp };
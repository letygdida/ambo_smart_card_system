const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');
const authPath = path.join(__dirname, 'routes', 'auth.js');
const text = fs.readFileSync(authPath, 'utf8');
const start = text.indexOf('const insertSql = `INSERT INTO student_registrations');
const end = text.indexOf('`;', start);
const sql = text.substring(start, end);
const valuesStart = text.indexOf('const values = [', end);
const valuesEnd = text.indexOf('];', valuesStart);
const valuesText = text.substring(valuesStart, valuesEnd);
console.log('SQL:', sql);
console.log('question marks:', (sql.match(/\?/g) || []).length);
const colsMatch = sql.match(/INSERT INTO student_registrations \((.*?)\) VALUES/s);
if (colsMatch) {
  const cols = colsMatch[1].split(',').map(c => c.trim()).filter(Boolean);
  console.log('columns:', cols.length, cols);
}
const values = valuesText.split(/,\s*(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/).map(v => v.trim()).filter(v => v && !v.startsWith('const values'));
console.log('values:', values.length, values);
const connection = mysql.createConnection({ host:'localhost', user:'root', password:'', database:'ambo_smart_card' });
console.log('formatted:', connection.format(sql.replace(/^const insertSql = `/, '').replace(/`$/, ''), values));
connection.end();

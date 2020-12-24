// module.exports = {
//     initializeExpressApp
// }

const express = require('express');

const path = require('path');
const http = require('http');
const ejs = require('ejs');
console.log("asas");
const { initializeSocketServer } = require('./socketserver');

var server;


console.log("SSS");
app = express();

app
    .use(express.urlencoded({ limit: '50mb', extended: false })) // parse application/x-www-form-urlencoded
    .use(express.json({ limit: '50mb' })) // parse application/json
    .use(express.static(path.join(__dirname, '../public'))) // all assets will be provided from 'public' folder
    .set('views', path.join(__dirname, '../views')) // views will be provided from 'views' folder
    .set('view engine', 'ejs') // selecting view engine as html
    //.engine('html', ejs.renderFile) // view will be rendered using ejs
    //.use('/', require('../routes/index')) // index routes

server = http.createServer(app);
//  console.log("gt", __dirname);


initializeSocketServer(server);


let port = process.env.argv || 3000
server.listen(port, function() {
    console.log("Server listening to the port ", port, new Date());
});
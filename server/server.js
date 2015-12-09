var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var http = require('http').Server(app);
var path = require('path');
var auth = process.env.AUTH || null;

// -- SERVE STATIC FILES and JSON

app.use(express.static('public'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// -- START SERVER

var port = process.env.PORT || 3033;
console.log('Listening on port', port);
http.listen(port);

console.log(auth);

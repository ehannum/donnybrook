var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var http = require('http').Server(app);
var path = require('path');
var Parse = require('parse/node').Parse;
var auth = process.env.AUTH || null;

// -- SERVE STATIC FILES and JSON

app.use(express.static('public'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// -- CREATE CALENDAR EVENTS

if (auth) {
  auth = JSON.parse(auth);
  Parse.initialize(auth.appID, auth.javaScriptKey);
}

app.post('/calendar', function (req, res) {
  if (!auth) {
    res.send('Error: Parse authentication failed');
    return;
  }

  var Trip = Parse.Object.extend('Trips');
  var trip = new Trip();

  trip.set('startDate', new Date(req.body.startDate));
  trip.set('endDate', new Date(req.body.endDate));
  trip.set('name', req.body.name);
  trip.set('comment', req.body.comment);

  trip.save(null, {
    success: function (data) {
      res.send(data);
    },
    error: function (data, error) {
      console.log('ERROR: ' + error.message);
    }
  });
});

// -- START SERVER

var port = process.env.PORT || 3033;
console.log('Listening on port', port);
http.listen(port);
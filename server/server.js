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
    console.log('Error: Parse authentication failed');
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
      console.log('ERROR: ' + error.code + ' ' + error.message);
      res.send('ERROR: ' + error.code + ' ' + error.message);
    }
  });
});

// -- FETCH CALENDAR EVENTS

app.get('/events', function (req, res) {
  if (!auth) {
    console.log('Error: Parse authentication failed');
    res.send('Error: Parse authentication failed');
    return;
  }

  var Trip = Parse.Object.extend('Trips');
  var trips = new Parse.Query(Trip);

  trips.find({
    success: function (data) {
      res.send(data);
    },
    error: function (data, error) {
      console.log('ERROR: ' + error.code + ' ' + error.message);
      res.send('ERROR: ' + error.code + ' ' + error.message);
    }
  });
});

// -- POST TO BULLETIN BOARD

app.post('/messages', function (req, res) {
  if (!auth) {
    console.log('Error: Parse authentication failed');
    res.send('Error: Parse authentication failed');
    return;
  }

  var Post = Parse.Object.extend('Posts');
  var post = new Post();

  post.set('message', req.body.message);

  post.save(null, {
    success: function (data) {
      res.send(data);
    },
    error: function (data, error) {
      console.log('ERROR: ' + error.code + ' ' + error.message);
      res.send('ERROR: ' + error.code + ' ' + error.message);
    }
  });
});

// -- FETCH BULLETIN BOARD MESSAGES

app.get('/messages', function (req, res) {
  if (!auth) {
    console.log('Error: Parse authentication failed');
    res.send('Error: Parse authentication failed');
    return;
  }

  var Post = Parse.Object.extend('Posts');
  var posts = new Parse.Query(Post);

  posts.find({
    success: function (data) {
      res.send(data);
    },
    error: function (data, error) {
      console.log('ERROR: ' + error.code + ' ' + error.message);
      res.send('ERROR: ' + error.code + ' ' + error.message);
    }
  });
});

// -- SAVE PUSH NOTIFICATION ENDPOINTS

app.post('/push-subs', function (req, res) {
  if (!auth) {
    console.log('Error: Parse authentication failed');
    res.send('Error: Parse authentication failed');
    return;
  }

  var endpoint = '';

  if (req.body.endpoint.match(/https:\/\/android.googleapis.com\/gcm\/send/gi)) {
    endpoint = req.body.endpoint.split('/');
    endpoint = endpoint[endpoint.length -1];
  }

  var Subscription = Parse.Object.extend('Subscriptions');
  var subscription = new Subscription();
  var query = new Parse.Query(Subscription);
  query.equalTo('endpoint', endpoint);

  query.find({
    success: function (results) {
      if (!results.length) {
        subscription.set('endpoint', endpoint);

        subscription.save(null, {
          success: function (data) {
            res.send(data);
          },
          error: function (data, error) {
            console.log('ERROR: ' + error.code + ' ' + error.message);
            res.send('ERROR: ' + error.code + ' ' + error.message);
          }
        });
      } else {
        res.send('Push notification endpoint already saved.');
      }
    },
    error: function (data, error) {
      console.log('ERROR: ' + error.code + ' ' + error.message);
      res.send('ERROR: ' + error.code + ' ' + error.message);
    }
  });
});

// -- START SERVER

var port = process.env.PORT || 3033;
console.log('Listening on port', port);
http.listen(port);

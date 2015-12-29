var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var querystring = require('querystring');
var http = require('http');
var server = http.Server(app);
var path = require('path');
var Parse = require('parse/node').Parse;
var auth = process.env.AUTH || null;
var gKey = process.env.G_API_KEY || null;

var fs = require('fs');

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
      dispatchPushNotification(data);
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
      dispatchPushNotification(data);
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

  var registrationId = '';

  if (req.body.endpoint.match(/https:\/\/android.googleapis.com\/gcm\/send/gi)) {
    var endpoint = req.body.endpoint.split('/');
    registrationId = endpoint.pop();
  } else {
    registrationId = req.body.endpoint;
  }

  var Subscription = Parse.Object.extend('Subscriptions');
  var subscription = new Subscription();
  var query = new Parse.Query(Subscription);
  query.equalTo('registrationId', registrationId);

  query.find({
    success: function (results) {
      if (!results.length) {
        subscription.set('registrationId', registrationId);

        subscription.save(null, {
          success: function (data) {
            res.send('New push notification registration ID created.');
          },
          error: function (data, error) {
            console.log('ERROR: ' + error.code + ' ' + error.message);
            res.send('ERROR: ' + error.code + ' ' + error.message);
          }
        });
      } else {
        res.send('Push notification registration ID already saved.');
      }
    },
    error: function (data, error) {
      console.log('ERROR: ' + error.code + ' ' + error.message);
      res.send('ERROR: ' + error.code + ' ' + error.message);
    }
  });
});

// -- DISABLE PUSH NOTIFICATION ENDPOINT

app.delete('/push-subs', function (req, res) {
  if (!auth) {
    console.log('Error: Parse authentication failed');
    res.send('Error: Parse authentication failed');
    return;
  }

  var registrationId = '';

  if (req.body.endpoint.match(/https:\/\/android.googleapis.com\/gcm\/send/gi)) {
    var endpoint = req.body.endpoint.split('/');
    registrationId = endpoint.pop();
  } else {
    registrationId = req.body.endpoint;
  }

  var Subscription = Parse.Object.extend('Subscriptions');
  var subscription = new Subscription();
  var query = new Parse.Query(Subscription);
  query.equalTo('registrationId', registrationId);

  query.find({
    success: function (results) {
      if (results.length === 1) {
        query.get(results[0].id, {
          success: function (singleSub) {
            singleSub.destroy({
              success: function (data) {
                res.send('Push notification registration ID DESTROYED!');
              },
              error: function (data, error) {
                console.log('ERROR: ' + error.code + ' ' + error.message);
                res.send('ERROR: ' + error.code + ' ' + error.message);
              }
            });
          },
          error: function (data, error) {
            console.log('ERROR: ' + error.code + ' ' + error.message);
            res.send('ERROR: ' + error.code + ' ' + error.message);
          }
        });
      } else {
        res.send('Push notification registration ID not fount.');
      }
    },
    error: function (data, error) {
      console.log('ERROR: ' + error.code + ' ' + error.message);
      res.send('ERROR: ' + error.code + ' ' + error.message);
    }
  });
});

// -- DISPATCH PUSH NOTIFICATIONS

var dispatchPushNotification = function (data) {
  if (!gKey) {
    console.log('Error: Google authentication failed');
    return;
  }

  var Subscription = Parse.Object.extend('Subscriptions');
  var query = new Parse.Query(Subscription);

  query.find({
    success: function (results) {
      var ids = [];

      for (var i = 0; i < results.length; i++) {
        ids.push(results[i].get('registrationId'));
      }

      var postReq = http.request({
        method: 'POST',
        hostname: 'android.googleapis.com',
        path: '/gcm/send',
        headers: {
          'Authorization': 'key=' + gKey,
          'Content-Type': 'application/json'
        }
      }, function (res) {
        res.on('data', function (chunk) {
          console.log('Got: ' + chunk);
        });
      });

      postReq.write(JSON.stringify({registration_ids: ids}));
      postReq.end();
    },
    error: function (data, error) {
      console.log('ERROR: ' + error.code + ' ' + error.message);
    }
  });
};

// -- START SERVER

var port = process.env.PORT || 3033;
console.log('Listening on port', port);
server.listen(port);

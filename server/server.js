var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var querystring = require('querystring');
var http = require('http');
var server = http.Server(app);
var path = require('path');

var firebase = require('firebase');
var gKey = process.env.G_API_KEY || null;
var fKey = process.env.FIREBASE_KEY || null;
var db = null;

// -- FIREBASE DATABASE SETUP

if (fKey) {
  firebase.initializeApp({
    serviceAccount: __dirname + '/firebase_cert.json',
    databaseURL: 'https://donnybook-push.firebaseio.com/'
  });

  db = firebase.database();
  console.log('Connected and authenticated to Firebase.');
} else {
  console.log('Firebase authentication failure: No Private Key found.');
}

// -- SERVE STATIC FILES and JSON

app.use(express.static('public'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// -- CREATE CALENDAR EVENTS

app.post('/calendar', function (req, res) {
  if (!db) {
    console.log('Error: Firebase authentication failed');
    res.send('Error: Firebase authentication failed');
    return;
  }

  var ref = db.ref('trips/2016');

  var tripRef = ref.push();

  tripRef.set(
    {
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      name: req.body.name,
      comment: req.body.comment
    }, function (err) {
      if (err) {
        console.log('error:', err);
        res.send('ERROR: ' + err);
      } else {
        res.send('Success!');
      }
    }
  );
});

// -- FETCH CALENDAR EVENTS

app.get('/events', function (req, res) {
  if (!db) {
    console.log('Error: Firebase authentication failed');
    res.send('Error: Firebase authentication failed');
    return;
  }

  var ref = db.ref('trips/2016');

  ref.once('value', function (data) {
    res.send(data.val());
  });
});

// -- POST TO BULLETIN BOARD

app.post('/messages', function (req, res) {
  if (!db) {
    console.log('Error: Firebase authentication failed');
    res.send('Error: Firebase authentication failed');
    return;
  }

  var ref = db.ref('messages');

  var messRef = ref.push();

  messRef.set(
    {
      createdAt: (new Date()).getTime(),
      message: req.body.message
    }, function (err) {
      if (err) {
        console.log('error:', err);
        res.send('ERROR: ' + err);
      } else {
        res.send({
          createdAt: (new Date()).getTime(),
          message: req.body.message
        });
      }
    }
  );
});

// -- FETCH BULLETIN BOARD MESSAGES

app.get('/messages', function (req, res) {
  if (!db) {
    console.log('Error: Firebase authentication failed');
    res.send('Error: Firebase authentication failed');
    return;
  }

  var ref = db.ref('messages');

  ref.once('value', function (data) {
    res.send(data.val());
  });
});

// -- SAVE PUSH NOTIFICATION ENDPOINTS

app.post('/push-subs', function (req, res) {
  if (!db) {
    console.log('Error: Firebase authentication failed');
    res.send('Error: Firebase authentication failed');
    return;
  }

  var registrationId = '';

  if (req.body.endpoint.match(/https:\/\/android.googleapis.com\/gcm\/send/gi)) {
    var endpoint = req.body.endpoint.split('/');
    registrationId = endpoint.pop();
  } else {
    registrationId = req.body.endpoint;
  }

  var ref = db.ref('subscriptions');

  ref.orderByChild('registrationId').equalTo(registrationId).once('value', function(data){
    if (!data.numChildren()) {
      var pushSubRef = ref.push();

      pushSubRef.set(
        {
          registrationId: registrationId
        }, function (err) {
          if (err) {
            console.log('error:', err);
            res.send('ERROR: ' + err);
          } else {
            res.send('Subscribed to push notifications.');
          }
        }
      );
    } else {
      res.send('Push notification subscription found.');
    }
  });
});

// -- DISABLE PUSH NOTIFICATION ENDPOINT

app.delete('/push-subs', function (req, res) {
  if (!db) {
    console.log('Error: Firebase authentication failed');
    res.send('Error: Firebase authentication failed');
    return;
  }

  var registrationId = '';

  if (req.body.endpoint.match(/https:\/\/android.googleapis.com\/gcm\/send/gi)) {
    var endpoint = req.body.endpoint.split('/');
    registrationId = endpoint.pop();
  } else {
    registrationId = req.body.endpoint;
  }

  var ref = db.ref('subscriptions');

  ref.orderByChild('registrationId').equalTo(registrationId).once('value', function(data){
    data.forEach(function(obj){
      ref.child(obj.key).remove();
    });
    res.send('Unsubscribed from push notifications.');
  });
});

// -- DISPATCH PUSH NOTIFICATIONS

var lastPushNotification = 0;
var pushSpamDelay = 10000;

var dispatchPushNotification = function (data) {
  if (!gKey) {
    console.log('Error: Google authentication failed');
    return;
  }

  var timeNow = (new Date()).getTime();

  if (lastPushNotification < lastPushNotification + pushSpamDelay) {
    pushSpamDelay += 5000;
    console.log('Throttling push notification frequency to once per ' + pushSpamDelay/1000 + ' sec.');
    return;
  } else {
    lastPushNotification = timeNow;
    pushSpamDelay = 10000;
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
          console.log('Error posting to google api. Got ' + chunk);
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

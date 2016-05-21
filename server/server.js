var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var querystring = require('querystring');
var http = require('http');
var https = require('https');
var server = http.Server(app);
var path = require('path');

var firebase = require('firebase');
var gKey = process.env.G_API_KEY || null;
var fKey = process.env.FIREBASE_KEY || null;
var db = null;

// -- FIREBASE DATABASE SETUP

if (fKey) {
  firebase.initializeApp({
    serviceAccount: JSON.parse(fKey),
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
        dispatchPushNotification();
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
var pushSpamDelay = 30000;

var dispatchPushNotification = function (data) {
  if (!gKey) {
    console.log('Error: Google authentication failed');
    return;
  }
  if (!db) {
    console.log('Error: Firebase authentication failed');
    res.send('Error: Firebase authentication failed');
    return;
  }

  var timeNow = (new Date()).getTime();

  if (timeNow < lastPushNotification + pushSpamDelay) {
    pushSpamDelay += 30000;
    console.log('Throttling push notification frequency to once per ' + pushSpamDelay/1000 + ' sec.');
    return;
  } else {
    lastPushNotification = timeNow;
    pushSpamDelay = 30000;
  }

  var ref = db.ref('subscriptions');

  ref.once('value', function(data){
    var ids = [];

    data.forEach(function(obj){
      ids.push(obj.child('registrationId').val());
    });


    var postReq = https.request({
      method: 'POST',
      hostname: 'android.googleapis.com',
      path: '/gcm/send',
      headers: {
        'Authorization': 'key=' + gKey,
        'Content-Type': 'application/json'
      }
    }, function (res) {
      res.setEncoding('utf8');
      res.on('data', function (chunk) {
        chunk = JSON.parse(chunk);
        console.log('success:', chunk.success);
        if (res.statusCode == 200 && chunk.success) {
          console.log('Push notification (theoretically) sent!');
        }
      });
    });

    postReq.on('error', function (err) {
      console.log('Error:', err);
    });

    postReq.write(JSON.stringify({registration_ids: ids}));
    postReq.end();
  });
};

// -- START SERVER

var port = process.env.PORT || 3033;
console.log('Listening on port', port);
server.listen(port);

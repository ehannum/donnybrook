function initialiseState () {
  if (!('showNotification' in ServiceWorkerRegistration.prototype)) {
    console.warn('Notifications not supported.');
    return;
  }

  if (Notification.permission === 'denied') {
    console.warn('User has blocked notifications.');
    return;
  }

  if (!('PushManager' in window)) {
    console.warn('Push messaging not supported.');
    return;
  }

  navigator.serviceWorker.ready.then(function (serviceWorkerRegistration) {
    serviceWorkerRegistration.pushManager.getSubscription()
    .then(function (subscription) {
      $('.push-notifications')[0].disabled = false;

      if (!subscription) return;

      saveSubscription(subscription);

      pushEnabled = true;
      $('.push-notifications').text('Disable Notifications');
    })
    .catch(function (err) {
      console.warn('error getting subscription:', err);
    });
  });
}

self.addEventListener('push', function (evt) {
  console.log('BING BONG!', evt);

  var title = 'DonnyBook';
  var body = 'New cabin trip scheduled in DonnyBook!';
  var icon = 'res/icon192.png';
  var tag = 'sample_tag';

  evt.waitUntil(
    self.registration.showNotification(title, {
      body: body,
      icon: icon,
      tag: tag
    })
  );
});

self.addEventListener('notificationclick', function (evt) {
  console.log('BING BONG CLICK!', evt.notification.tag);
  // You have to manually close android notifications
  evt.notification.close();

  // This looks to see if the current is already open and
  // focuses if it is
  evt.waitUntil(
    clients.matchAll({
      type: "window"
    })
    .then(function(clientList) {
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if (client.url == '/' && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

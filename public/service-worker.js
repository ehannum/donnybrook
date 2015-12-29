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
  var body = 'New messages in DonnyBook!';
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

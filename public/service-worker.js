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

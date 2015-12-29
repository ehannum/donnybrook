$(function () {
  // enable push notifications if possible

  $('.push-notifications').click(function (evt) {
    if (pushEnabled) {
      unsubscribePush();
    } else {
      subscribePush();
    }
  });

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js').then(initialiseState);
  } else {
    console.warn('Service workers not supported in this browser. Push notifications not possible.');
  }

  var subscribePush = function () {
    navigator.serviceWorker.ready.then(function (serviceWorkerRegistration) {
      serviceWorkerRegistration.pushManager.subscribe({userVisibleOnly: true})
      .then(function (subscription) {
        console.log('Subscribing!');
        pushEnabled = true;

        $('.push-notifications').text('Disable Notifications');
        return saveSubscription(subscription);
      })
      .catch(function (err) {
        console.warn('Unable to subscribe to push:', err);
      });
    });
  };

  var unsubscribePush = function () {
    navigator.serviceWorker.ready.then(function (serviceWorkerRegistration) {
      serviceWorkerRegistration.pushManager.getSubscription().then(function (pushSubscription) {
        if (!pushSubscription) {
          // you are not curently subscribed?
          pushEnabled = false;
          $('.push-notifications').text('Enable Notifications');
          return;
        }

        pushSubscription.unsubscribe().then(function (success) {
          pushEnabled = false;
          $('.push-notifications').text('Enable Notifications');
          deleteSubscription(pushSubscription);
        })
        .catch(function (err) {
          console.warn('Error during unsubscription:', err);
        });
      })
      .catch(function (err) {
        console.log('Error JUST before unsubscription:', err);
      });
    });
  };

  deleteSubscription = function (subscription) {
    $.ajax({
      method: 'DELETE',
      url: '/push-subs',
      data: {
        endpoint: subscription.endpoint
      },
      success: function (data) {
        console.log('SUCCESS:', data);
      },
      error: function (err) {
        console.log('Error:', err);
      }
    });
  };

  saveSubscription = function (subscription) {
    $.ajax({
      method: 'POST',
      url: '/push-subs',
      data: {
        endpoint: subscription.endpoint
      },
      success: function (data) {
        console.log('SUCCESS:', data);
      },
      error: function (err) {
        console.log('Error:', err);
      }
    });
    return true;
  };
});

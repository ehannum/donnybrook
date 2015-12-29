$(function () {

  pushEnabled = false; // must be global for service-worker.js to access
  // replace "100vh" attributes with actual heights of elements
  // prevents the site from breaking if viewport changes
  // due to rotation or the keyboard opening.
  $('.para-box').each(function (index, element) {
    $(this).css('height', window.innerHeight + 'px');
  });

  var calendar = $('#calendar').clndr({
    template: $('#clndr-temp').html(),
    daysOfTheWeek: ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
  });

  $('button[href]').click(function () {
    target = $(this.getAttribute('href'));
    $('.parallax').animate({
      scrollTop: target.position().top + $('.parallax').scrollTop()
    }, 500);
  });

  $('.menu').click(function (evt) {
    if ($('.dropdown').height() === 0) {
      $('.dropdown').css('height', '140px');
    } else {
      $('.dropdown').css('height', '0px');
    }
  });

  $('body').click(function (evt) {
    if (evt.target !== $('.menu')[0]) {
      $('.dropdown').css('height', '0px');
    }
  });

  $('.push-notifications').click(function (evt) {
    if (pushEnabled) {
      unsubscribePush();
    } else {
      subscribePush();
    }
  });

  var colors = ['blue', 'purple', 'pink', 'orange', 'yellow', 'green'];
  var thisMonth = moment.months((new Date()).getMonth());

  $.get('/events', function (data) {
    for (var i = 0; i < data.length; i++) {
      createTrip(data[i].startDate.iso, data[i].endDate.iso, data[i].name, data[i].comment);
    }
  });

  $.get('/messages', function (data) {
    for (var i = 0; i < data.length; i++) {
      var postTime = moment(new Date(data[i].createdAt)).format('MM/DD/YY');
      var mess = $('.messages').prepend('<h4>').find('h4')[0];
      $(mess).text(postTime + ' - ' + data[i].message);
    }
  });

  var createTrip = function (start, end, name, comment) {
    var tripDates = [];

    date = (new Date(start)).setUTCHours(8);
    end = (new Date(end)).setUTCHours(8);

    while (date <= end) {
      tripDates.push({date: date, color: colors[0]});

      date = (new Date(date + 86400000)).getTime();
    }

    tripDates[0].name = name + ' arrives';
    tripDates[tripDates.length - 1].name = name + ' leaves';

    colors.push(colors.shift());

    calendar.addEvents(tripDates);
  };

  $('.new-trip').submit(function (evt) {
    evt.preventDefault();
    var startDate = $('.start-date').val();
    var endDate = $('.end-date').val();
    var name = $('.name').val();
    var comment = $('.comment').val();

    $('.start-date').val('');
    $('.end-date').val('');
    $('.name').val('');
    $('.comment').val('');

    $.ajax({
      method: 'POST',
      url: '/calendar',
      data: {
        startDate: startDate,
        endDate: endDate,
        name: name,
        comment: comment
      },
      success: function (data) {
        alert('You are now booked for the cabin from ' + moment(startDate).format('dddd, MMMM DD YYYY') + ' to ' + moment(endDate).format('dddd, MMMM DD YYYY') + '!');
        createTrip(startDate, endDate, name, comment);
      },
      error: function (error) {
        console.log(error);
      }
    });
  });

  $('.new-message').submit(function (evt) {
    evt.preventDefault();
    var message = $('.message-input').val();

    $('.message-input').val('');

    $.ajax({
      method: 'POST',
      url: '/messages',
      data: {
        message: message
      },
      success: function (data) {
        var postTime = moment(new Date(data.createdAt)).format('MM/DD/YY');
        var mess = $('.messages').prepend('<h4>').find('h4')[0];
        $(mess).text(postTime + ' - ' + unescape(data.message));
      },
      error: function (error) {
        console.log(error);
      }
    });
  });

  // enable push notifications if possible

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

  };

  var saveSubscription = function (subscription) {
    $.ajax({
      method: 'POST',
      url: '/push-subs',
      data: {
        subscription: subscription
      },
      success: function (data) {
      },
      error: function (err) {
        console.log('Error:', err);
      }
    });
  };
});

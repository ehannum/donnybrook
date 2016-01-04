$(function () {
  var calendar = $('#calendar').clndr({
    template: $('#clndr-temp').html(),
    daysOfTheWeek: ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
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
      var mess = $('.messages').prepend('<p>').find('p')[0];
      $(mess).text(data[i].message);
      $(mess).prepend('<b> ' + postTime + ': </b>');
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
        var mess = $('.messages').prepend('<p>').find('p')[0];
        $(mess).text(unescape(data.message));
        $(mess).prepend('<b> ' + postTime + ': </b>');
      },
      error: function (error) {
        console.log(error);
      }
    });
  });
});

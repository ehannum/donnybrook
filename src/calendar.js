$(function () {
  var calendar = $('#calendar').clndr({
    template: $('#clndr-temp').html(),
    daysOfTheWeek: ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
  });

  $('button[href]').click(function () {
    target = $(this.getAttribute('href'));
    $('.parallax').animate({
      scrollTop: target.offset().top
    }, 500);
    return false;
  });

  var colors = ['blue', 'purple', 'pink', 'orange', 'yellow', 'green'];
  var thisMonth = moment.months((new Date()).getMonth());

  $.get('/events', function (data) {
    console.log(data);
    for (var i = 0; i < data.length; i++) {
      createTrip(data[i].startDate.iso, data[i].endDate.iso, data[i].name, data[i].comment);
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
        console.log(data);
      }
    });
  });
});

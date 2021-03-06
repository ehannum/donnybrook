$(function () {

  pushEnabled = false; // must be global for service-worker.js to access.

  // replace "100vh" attributes with actual heights of elements
  // prevents the site from breaking if viewport changes
  // due to rotation or the keyboard opening.
  $('.para-box').each(function (index, element) {
    $(this).css('height', window.innerHeight + 'px');
  });

  // fuzzy scroll snapping
  $('.parallax').scroll(function(){
    var $this = $(this);
    if ($this.data('scrollTimeout')) {
      clearTimeout($this.data('scrollTimeout'));
    }
    $this.data('scrollTimeout', setTimeout(fuzzyScroll, 500));
  });

  $.extend(jQuery.easing,{"ease-in-quad":function(x,t,b,c,d) { return c*(t/=d)*t + b; }})

  var fuzzyScroll = function () {
    // if the page is scrolled to an input field,
    // ex: if the on-screen keyboard is open for typing
    // then do not snap scroll
    if ($('input').is(':focus')) return;

    var boxHeight = parseInt($('.para-box').css('height'));
    var scrollPos = $('.parallax').scrollTop();

    var distance = scrollPos % boxHeight;
    var nearest = Math.round(scrollPos / boxHeight);
    var marginOfError = boxHeight / 4; // ish

    if (distance < marginOfError || distance > boxHeight - marginOfError) {
      $('.parallax').animate({
        scrollTop: boxHeight * nearest
      }, 250, "ease-in-quad");
    }
  };

  var calendar = $('#calendar').clndr({
    template: $('#clndr-temp').html(),
    daysOfTheWeek: ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'],
    clickEvents: {
      click: function(target) {
        if (target.events.length) {
          $('.event-modal-container').show();
          $('.event-details').html('');

          for (var i = 0; i < target.events.length; i++) {
            $('.event-details').append('<h2 class="name">' + target.events[i].description + '</h2>');
            $('.event-details').append('<h3>' + target.events[i].reservation + '</h3>');
            if (target.events[i].comment) {
              $('.event-details').append('<h3 class="comment">' + target.events[i].comment + '</h3>');
            }
            var cancelTrip = $('<button> Cancel Trip </button>');
            var id = target.events[i].id;
            $('.event-details').append(cancelTrip);
            cancelTrip.click(function () {
              $.ajax({
                type: 'DELETE',
                url: '/events/' + id,
                success: function (response) {
                  console.log(response);
                  alert('Trip successflly canceled :(\n\nSorry you couldn\'t make it. You can always reschedule!');
                  document.location.reload(true);
                },
                error: function (err) {
                  throw err;
                }
              });
            });
          }
        }
      }
    }
  });

  $('.event-modal-container').click(function (evt) {
    if (evt.target === $('.event-modal-container')[0]) {
      $('.event-modal-container').hide();
    }
  });

  $('button[href]').click(function () {
    target = $(this.getAttribute('href'));
    $('.parallax').animate({
      scrollTop: target.position().top + $('.parallax').scrollTop()
    }, 500);
  });

  $('.menu').click(function (evt) {
    if ($('.dropdown').height() === 0) {
      $('.dropdown').css('height', '180px');
    } else {
      $('.dropdown').css('height', '0px');
    }
  });

  $('body').click(function (evt) {
    if (evt.target !== $('.menu')[0]) {
      $('.dropdown').css('height', '0px');
    }
  });

  var colors = ['blue', 'purple', 'pink', 'orange', 'yellow', 'green'];
  var thisMonth = moment.months((new Date()).getMonth());

  $.get('/events', function (data) {
    for (var i in data) {
      createTrip(data[i].startDate, data[i].endDate, data[i].name, data[i].comment, i);
    }
  });

  $.get('/messages', function (data) {
    for (var i in data) {
      var postTime = moment(new Date(data[i].createdAt)).format('MM/DD/YY');
      var mess = $('.messages').prepend('<p>').find('p')[0];
      $(mess).text(data[i].message);
      $(mess).prepend('<b> ' + postTime + ': </b>');
    }
  });

  var createTrip = function (start, end, name, comment, id) {
    var tripDates = [];

    var date = (new Date(start)).setUTCHours(8);
    end = (new Date(end)).setUTCHours(8);
    var reservation = moment(date).format('dddd, MMMM Do') + ' - ' + moment(end).format('dddd, MMMM Do');

    while (date <= end) {
      tripDates.push({date: date, color: colors[0], description: name, comment: comment, reservation: reservation, id: id});

      date = (new Date(date + 86400000)).getTime();
    }

    if (name.match(/and|\&|\+|\,|\w*s$/gi)) {
      tripDates[0].name = name + ' arrive';
      tripDates[tripDates.length - 1].name = name + ' leave';
    } else {
      tripDates[0].name = name + ' arrives';
      tripDates[tripDates.length - 1].name = name + ' leaves';
    }

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
        alert('You are now booked for the cabin from ' + moment(startDate).format('dddd, MMMM Do YYYY') + ' to ' + moment(endDate).format('dddd, MMMM Do YYYY') + '!');
        var reservation = moment(startDate).format('dddd, MMMM Do') + ' - ' + moment(endDate).format('dddd, MMMM Do');
        createTrip(startDate, endDate, name, comment, reservation, data);
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

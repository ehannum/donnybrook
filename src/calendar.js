$(function () {
  $('#calendar').clndr({
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

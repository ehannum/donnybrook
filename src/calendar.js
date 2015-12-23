$(function () {
  $('#calendar').clndr({
    template: $('#clndr-temp').html()
  });

  $('button[href]').click(function () {
    target = $(this.getAttribute('href'));
    $('.parallax').animate({
      scrollTop: target.offset().top
    }, 500);
    return false;
  });

  $('.new-trip').submit(function (evt) {
    var startDate = $('.start-date').val();
    var endDate = $('.end-date').val();
    var name = $('.name').val();
    var comment = $('.comment').val();
    $.http({
      method: 'POST',
      url: '/calendar',
      data: {

      }
    });
    evt.preventDefault();
  });
});

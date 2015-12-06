console.log('hello');

$(function() {
  $('button[href]').click(function() {
    target = $(this.getAttribute('href'));
    $('.parallax').animate({
      scrollTop: target.offset().top
    }, 500);
    return false;
  });
});

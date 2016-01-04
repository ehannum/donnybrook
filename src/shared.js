$(function(){
  pushEnabled = false; // must be global for service-worker.js to access
  // replace "100vh" attributes with actual heights of elements
  // prevents the site from breaking if viewport changes
  // due to rotation or the keyboard opening.
  $('.para-box').each(function (index, element) {
    $(this).css('height', window.innerHeight + 'px');
  });

  $('button[href]').click(function () {
    target = this.getAttribute('href');
    if (target[0] === '#') {
      $('.parallax').animate({
        scrollTop: $(target).position().top + $('.parallax').scrollTop()
      }, 500);
    } else if (target[0] === '/') {
      window.location = window.location.origin + target;
    }
  });

  var dropdownHeight = $('.dropdown').children().length * 45;

  $('.menu').click(function (evt) {
    if ($('.dropdown').height() === 0) {
      $('.dropdown').css('height', dropdownHeight + 'px');
    } else {
      $('.dropdown').css('height', '0px');
    }
  });

  $('body').click(function (evt) {
    if (evt.target !== $('.menu')[0]) {
      $('.dropdown').css('height', '0px');
    }
  });
});

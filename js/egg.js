!(function() {
  var text = '';
  var sound = new Howl({
    src: ['audio/egg/drake.mp3']
  });

  document.addEventListener('keyup', function(e) {
    text += e.key;

    if (text.indexOf('drake') > -1) {
      console.log('DRAKE IT BABY!');
      $('body').html('<img style="margin: 100px auto 0; display: block" src="/img/drake.gif" />')
        .css({
          background: 'black',
          display: 'block'
        });

      sound.play();
    }
  });
}());

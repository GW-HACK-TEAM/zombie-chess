!(function() {
  var text = '';
  var loaded = false;
  var drake = new Howl({
    src: ['audio/egg/drake.mp3']
  });
  var epic = new Howl({
    src: ['audio/egg/epic-longer-sax.mp3']
  });
  document.addEventListener('keyup', function(e) {
    text += e.key;

    if (loaded) {
      return;
    }
    if (text.indexOf('drake') > -1) {
      backgroundSound.stop();
      loaded = true;
      console.log('DRAKE IT BABY!');
      $('body').html('<img style="margin: 100px auto 0; display: block" src="/img/drake.gif" />')
        .css({
          background: 'black',
          display: 'block'
        });

      drake.play();
    }
    if (text.indexOf('sax') > -1) {
      backgroundSound.stop();
      loaded = true;
      console.log('EPIC SAX GUY!');
      $('body').html('<img style="margin: 100px auto 0; display: block" src="/img/epicsax.gif" />')
            .css({
             background: 'black',
             display: 'block'
           });

      epic.play();
      sound.volume(1);
    }
  });
}());

'use strict';

let sounds = {
  general: {
    snapback: ['audio/general/snapback.mp3'],
    loosePiece: ['audio/general/3yell9.wav', 'audio/general/yell7.wav', 'audio/general/yell8.wav', 'audio/general/yell9.wav', 'audio/general/yell10.wav', 'audio/general/yell11.wav', 'audio/general/yell12.wav'],
  },
  black: {
    drag: ['black-drag.mp3'],
    drop: ['audio/rock/move.mp3'],
    snapback: ['black-snapback.mp3'],
    capturePiece: ['black-capture-piece.mp3'],
    captureSpecificPiece: ['blakc-capture-specific-piece.mp3'],
    loosePiece: ['audio/rock/3yell9.wav'],
    looseSpecificPiece: ['black-loose-specific-piece.mp3'],
    winning: ['black-winning.mp3'],
    losing: ['black-losing.mp3'],
    winner: ['audio/edm/winner.mp3'],
    loser: [''],
    check: ['black-check.mp3']
  },
  white: {
    drag: ['white-drag.mp3'],
    drop: ['audio/edm/move.mp3'],
    snapback: ['white-snapback.mp3'],
    capturePiece: ['white-capture-piece.mp3'],
    captureSpecificPiece: ['blakc-capture-specific-piece.mp3'],
    loosePiece: ['white-loose-piece.mp3'],
    looseSpecificPiece: ['white-loose-specific-piece.mp3'],
    winning: ['white-winning.mp3'],
    losing: ['white-losing.mp3'],
    winner: ['audio/edm/winner.mp3'],
    loser: [''],
    check: ['white-check.mp3']
  }
}


let getGroupMoodSound = (color, event) => {
  let eventArray = sounds[color][event];
  let index = Math.floor(Math.random() * eventArray.length);
  console.log(index);
  let file = sounds[color][event][index];
  return file;
};

let moodSound = (file) => {
  var sound = new Howl({
    src: [ file ]
  });
  sound.play();
}

Bulletin.subscribe('captured', (data) => {
  console.log('Capture Sound');
  console.log(data);
  var file = getGroupMoodSound('general', 'loosePiece');
  moodSound(file);
});

Bulletin.subscribe('dropped', (data) => {
  console.log(data);
  var file;
  if(data.from.indexOf('a') > -1) {
    file = getGroupMoodSound('white', 'drop');
  } else {
    file = getGroupMoodSound('black', 'drop');
  }

  if(data.snapback) {
    file = getGroupMoodSound('general', 'snapback');
  }
  moodSound(file);
});

Bulletin.subscribe('gameOver', (data) => {
  console.log(data);
  var file;
  if(data.winner == 'white') {
    file = getGroupMoodSound('white', 'winner');
  } else {
    file = getGroupMoodSound('black', 'winner');
  }
  moodSound(file);
});


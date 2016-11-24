const engineGame = function engineGame(options) {
  options = options || {};
  var game = new Chess();
  var board;
  // We can load Stockfish via Web Workers or via STOCKFISH() if loaded from a <script> tag.
  var engine = typeof STOCKFISH === "function" ? STOCKFISH() : new Worker(options.stockfishjs || './js/contrib/stockfish.js');
  var evaler = typeof STOCKFISH === "function" ? STOCKFISH() : new Worker(options.stockfishjs || './js/contrib/stockfish.js');
  var engineStatus = {};
  var displayScore = false;
  var time = { wtime: 300000, btime: 300000, winc: 2000, binc: 2000 };
  var playerColor = localStorage.getItem('color');
  // var playerColor = 'black';
  var clockTimeoutID = null;
  var isEngineRunning = false;
  var evaluation_el = document.getElementById("evaluation");
  var announced_game_over;

  // do not pick up pieces if the game is over
  // only pick up pieces for White
  var onDragStart = function(source, piece) {
    var re = playerColor === 'white' ? /^b/ : /^w/;

    if (game.game_over() || piece.search(re) !== -1) {
      return false;
    }

    console.log('Drag start');
  };

  var onDragMove = function(newLocation, oldLocation, source, piece, position, orientation) {
    /* console.log('Drag move');
    console.log("New location: " + newLocation);
    console.log("Old location: " + oldLocation);
    console.log("Source: " + source);
    console.log("Piece: " + piece);
    console.log("Position: " + ChessBoard.objToFen(position));
    console.log("Orientation: " + orientation);
    console.log(' ');*/
  };


  var onDrop = function(source, target) {
    var move = game.move({
      from: source,
      to: target,
      promotion: document.getElementById("promote").value
    });

    // illegal move
    if (move === null) {
      EventsLib.dropped(source, target, true);

      return 'snapback';
    }

    EventsLib.dropped(source, target, false);

    prepareMove();
  };

  // update the board position after the piece snap
  // for castling, en passant, pawn promotion
  var onSnapEnd = function() {
    board.position(game.fen());
  };

  var onMoveEnd = function(oldPos, newPos) {
    EventsLib.dropped(oldPos, newPos, false);
    EventsLib.captured(oldPos, newPos);

    if (game.in_checkmate()) {
      EventsLib.gameOver(oldPos, newPos);

      return;
    }

    if (game.in_check()) {
      EventsLib.check(oldPos, newPos);
    }
  };
  const uciCmd = function uciCmd(cmd, which) {
    (which || engine).postMessage(cmd);
  };

  uciCmd('uci');

  const displayStatus = function displayStatus() {
    var status = 'Engine: ';
    if (!engineStatus.engineLoaded) {
      status += 'loading...';
    } else if (!engineStatus.engineReady) {
      status += 'loaded...';
    } else {
      status += 'ready.';
    }

    if (engineStatus.search) {
      status += '<br>' + engineStatus.search;
      if (engineStatus.score && displayScore) {
        status += (engineStatus.score.substr(0, 4) === "Mate" ? " " : ' Score: ') + engineStatus.score;
      }
    }
    $('.score').html(engineStatus.score);
    $('#engineStatus').html(status);
  };

  const displayClock = function displayClock(color, t) {
    var isRunning = false;
    if (time.startTime > 0 && color === time.clockColor) {
      t = Math.max(0, t + time.startTime - Date.now());
      isRunning = true;
    }
    var id = color === playerColor ? '#time2' : '#time1';
    var sec = Math.ceil(t / 1000);
    var min = Math.floor(sec / 60);
    sec -= min * 60;
    var hours = Math.floor(min / 60);
    min -= hours * 60;
    var display = hours + ':' + ('0' + min).slice(-2) + ':' + ('0' + sec).slice(-2);
    if (isRunning) {
      display += sec & 1 ? ' <--' : ' <-';
    }
    $(id).text(display);
  };

  const updateClock = function updateClock() {
    displayClock('white', time.wtime);
    displayClock('black', time.btime);
  };

  const clockTick = function clockTick() {
    updateClock();
    var t = (time.clockColor === 'white' ? time.wtime : time.btime) + time.startTime - Date.now();
    var timeToNextSecond = t % 1000 + 1;
    clockTimeoutID = setTimeout(clockTick, timeToNextSecond);
  };

  const stopClock = function stopClock() {
    if (clockTimeoutID !== null) {
      clearTimeout(clockTimeoutID);
      clockTimeoutID = null;
    }
    if (time.startTime > 0) {
      var elapsed = Date.now() - time.startTime;
      time.startTime = null;
      if (time.clockColor === 'white') {
        time.wtime = Math.max(0, time.wtime - elapsed);
      } else {
        time.btime = Math.max(0, time.btime - elapsed);
      }
    }
  };

  const startClock = function startClock() {
    if (game.turn() === 'w') {
      time.wtime += time.winc;
      time.clockColor = 'white';
    } else {
      time.btime += time.binc;
      time.clockColor = 'black';
    }
    time.startTime = Date.now();
    clockTick();
  };

  const get_moves = function get_moves() {
    var moves = '';
    var history = game.history({verbose: true});

    for (var i = 0; i < history.length; ++i) {
      var move = history[i];
      moves += ' ' + move.from + move.to + (move.promotion ? move.promotion : '');
    }

    return moves;
  };

  const prepareMove = function prepareMove() {
    stopClock();
    $('#pgn').text(game.pgn());
    board.position(game.fen());
    updateClock();
    var turn = game.turn() === 'w' ? 'white' : 'black';
    if (!game.game_over()) {
      if (turn !== playerColor) {
        uciCmd('position startpos moves' + get_moves());
        uciCmd('position startpos moves' + get_moves(), evaler);
        evaluation_el.textContent = "";
        uciCmd("eval", evaler);

        if (time && time.wtime) {
          uciCmd("go " + (time.depth ? "depth " + time.depth : "") + " wtime " + time.wtime + " winc " + time.winc + " btime " + time.btime + " binc " + time.binc);
        } else {
          uciCmd("go " + (time.depth ? "depth " + time.depth : ""));
        }
        isEngineRunning = true;
      }
      if (game.history().length >= 2 && !time.depth && !time.nodes) {
        startClock();
      }
    }
  };

  evaler.onmessage = function(event) {
    var line;

    if (event && typeof event === "object") {
      line = event.data;
    } else {
      line = event;
    }

    // Ignore some output.
    if (line === "uciok" || line === "readyok" || line.substr(0, 11) === "option name") {
      return;
    }

    if (evaluation_el.textContent) {
      evaluation_el.textContent += "\n";
    }
    evaluation_el.textContent += line;
  };

  engine.onmessage = function(event) {
    // console.log('engine:', event);
    var line;
    var match;
    var moveMatch;

    if (event && typeof event === "object") {
      line = event.data;
    } else {
      line = event;
    }
    if (line === 'uciok') {
      engineStatus.engineLoaded = true;
    } else if (line === 'readyok') {
      engineStatus.engineReady = true;
    } else {
      moveMatch = line.match(/^bestmove ([a-h][1-8])([a-h][1-8])([qrbn])?/);
      // Did the AI move?
      if (moveMatch) {
        setTimeout(function() {
          isEngineRunning = false;
          game.move({from: moveMatch[1], to: moveMatch[2], promotion: moveMatch[3]});
          prepareMove();
          uciCmd("eval", evaler);
          evaluation_el.textContent = "";
          // uciCmd("eval");
          // Is it sending feedback?
        }, 500);
      } else if (match = line.match(/^info .*\bdepth (\d+) .*\bnps (\d+)/)) {
        engineStatus.search = 'Depth: ' + match[1] + ' Nps: ' + match[2];
      }

      // Is it sending feed back with a score?
      if (match = line.match(/^info .*\bscore (\w+) (-?\d+)/)) {
        var score = parseInt(match[2], 10) * (game.turn() === 'w' ? 1 : -1);
        // Is it measuring in centipawns?
        if (match[1] === 'cp') {
          engineStatus.score = (score / 100.0).toFixed(2);
          // Did it find a mate?
        } else if (match[1] === 'mate') {
          engineStatus.score = 'Mate in ' + Math.abs(score);
        }

        // Is the score bounded?
        if (match = line.match(/\b(upper|lower)bound\b/)) {
          engineStatus.score = (match[1] === 'upper' === (game.turn() === 'w') ? '<= ' : '>= ') + engineStatus.score;
        }
      }
    }
    displayStatus();
  };

  var pieceTheme = function(piece) {

    console.log(piece);

    if (piece === 'bQ') {
      return 'img/chesspieces/rockstars/freddie_sad_chess.png';
    }

    if (piece === 'bK') {
      return 'img/chesspieces/rockstars/bowie_icon_chess.png';
    }

    if (piece === 'wK') {
      return 'img/chesspieces/danceheroes/oliverheldens_icon_chess.png';
    }

    if (piece === 'wQ') {
      return 'img/chesspieces/danceheroes/bjork_icon_chess.png';
    }

    if (piece === 'wP') {
      return 'img/chesspieces/danceheroes/deadmau5_pawn_chess.png';
    }

    return 'img/chesspieces/wikipedia/' + piece + '.png';
  };

  var cfg = {
    showErrors: true,
    draggable: true,
    position: 'start',
    onDragStart: onDragStart,
    onDragMove: onDragMove,
    onDrop: onDrop,
    onSnapEnd: onSnapEnd,
    onMoveEnd: onMoveEnd,
    pieceTheme: pieceTheme,
  };

  board = new ChessBoard('board', cfg);

  return {
    reset: function() {
      game.reset();
      uciCmd('setoption name Contempt value 0');
      // uciCmd('setoption name Skill Level value 20');
      this.setSkillLevel(0);
      uciCmd('setoption name Aggressiveness value ' + 80);
      // Agressive 100 (it's now symetric)
      uciCmd('setoption name King Safety value 0');
    },
    loadPgn: function(pgn) {
      game.load_pgn(pgn);
    },
    setPlayerColor: function(color) {
      playerColor = color;
      board.orientation('white');
    },
    setSkillLevel: function(skill) {
      var max_err;
      var err_prob;

      if (skill < 0) {
        skill = 0;
      }
      if (skill > 20) {
        skill = 20;
      }

      time.level = skill;

      // Change thinking depth allowance.
      if (skill < 5) {
        time.depth = "1";
      } else if (skill < 10) {
        time.depth = "2";
      } else if (skill < 15) {
        time.depth = "3";
      } else {
        // Let the engine decide.
        time.depth = "";
      }

      uciCmd('setoption name Skill Level value ' + skill);

      // NOTE: Stockfish level 20 does not make errors (intentially), so these numbers have no effect on level 20.
      // Level 0 starts at 1
      err_prob = Math.round(skill * 6.35 + 2);
      console.log(err_prob);
      //  Level 0 starts at 10
      max_err = Math.round(skill * -0.5 + 10);

      uciCmd('setoption name Skill Level Maximum Error value ' + max_err);
      uciCmd('setoption name Skill Level Probability value ' + err_prob);
    },
    setTime: function(baseTime, inc) {
      time = { wtime: baseTime * 1000, btime: baseTime * 1000, winc: inc * 1000, binc: inc * 1000 };
    },
    setDepth: function(depth) {
      time = { depth: depth };
    },
    setNodes: function(nodes) {
      time = { nodes: nodes };
    },
    setContempt: function(contempt) {
      uciCmd('setoption name Contempt value ' + contempt);
    },
    setAggressiveness: function(value) {
      uciCmd('setoption name Aggressiveness value ' + value);
    },
    setDisplayScore: function(flag) {
      displayScore = flag;
      displayStatus();
    },
    start: function() {
      uciCmd('ucinewgame');
      uciCmd('isready');
      engineStatus.engineReady = false;
      engineStatus.search = null;
      displayStatus();
      prepareMove();
      announced_game_over = false;
    },
    undo: function() {
      if (isEngineRunning) {
        return false;
      }
      game.undo();
      game.undo();
      engineStatus.search = null;
      displayStatus();
      prepareMove();
      return true;
    }
  };
};

window.engineGame = engineGame;

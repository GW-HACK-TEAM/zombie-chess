!(function () {
  var whitePiecesCount = 16;
  var blackPiecesCount = 16;

  var eventsLib = {

    /**
     * When a piece is captured
     *
     * @param {Object} oldPos
     * @param {Object} newPos
     */
    captured: function (oldPos, newPos) {
      var oldPositions = this._mapPiecePositions(oldPos);
      var newPositions = this._mapPiecePositions(newPos);
      var capturedPieceDiff = [];
      var captureData = [];
      var updatedWhitePiecesCount = 0;
      var updatedBlackPiecesCount = 0;


      // If a piece is captured, work out which piece it was
      if (oldPositions.length != newPositions.length) {

        // Count how many pieces each team has
        updatedWhitePiecesCount = this._countPieces(newPos, 'white');
        updatedBlackPiecesCount = this._countPieces(newPos, 'black');

        // Find the differences
        capturedPieceDiff = _.difference(oldPositions, newPositions);

        // Work out who captured who
        captureData = this._getCaptureData(capturedPieceDiff, updatedWhitePiecesCount, updatedBlackPiecesCount);

        // Publish the captured event
        Bulletin.publish('captured', captureData);

        // Update state vars
        whitePiecesCount = updatedWhitePiecesCount;
        blackPiecesCount = updatedBlackPiecesCount;
      }
    },


    /**
     * When the game is in check
     *
     * @param {Object} oldPos
     * @param {Object} newPos
     */
    check: function (oldPos, newPos) {
      var oldPositions = this._mapPiecePositions(oldPos);
      var newPositions = this._mapPiecePositions(newPos);
      var capturedPieceDiff = _.difference(oldPositions, newPositions);
      var capturedPieceDiffSplit = [];
      var checkData = {};

      // See if there was a single last move before the win
      if (capturedPieceDiff.length == 1) {
        capturedPieceDiffSplit = capturedPieceDiff[0].split(':');

        if (capturedPieceDiffSplit[1].search(/^b/) !== -1) {
          checkData = { checked: 'white' };
        } else {
          checkData = { checked: 'black' };
        }
      }

      // Publish the dropped event
      Bulletin.publish('check', checkData);
    },


    /**
     * When a piece is dropped
     *
     * @param {String|Object} source
     * @param {String|Object} target
     * @param {Boolean} snapback
     */
    dropped: function (source, target, snapback) {
      var dropData = {};
      var oldPositions = [];
      var newPositions = [];
      var oldPosDiff = [];
      var newPosDiff = [];
      var oldPosDiffSplit = [];
      var newPosDiffSplit = [];
      var teamMoved = '';

      // Test what to do with the given data
      if (_.isString(source) && _.isString(target)) {
        dropData = {
          from: source,
          to: target,
          snapback: snapback
        };
      } else {
        oldPositions = this._mapPiecePositions(source);
        newPositions = this._mapPiecePositions(target);
        oldPosDiff = _.difference(oldPositions, newPositions);
        newPosDiff = _.difference(newPositions, oldPositions);
        oldPosDiffSplit = oldPosDiff[0].split(':');
        newPosDiffSplit = newPosDiff[0].split(':');
        teamMoved = newPosDiffSplit[1].search(/^w/) !== -1 ? 'white' : 'black';

        dropData = {
          team: teamMoved,
          from: oldPosDiffSplit[0],
          to: newPosDiffSplit[0],
          snapback: oldPosDiffSplit[0] == newPosDiffSplit[0]
        };

        console.log(dropData);
      }

      // Publish the dropped event
      // Bulletin.publish('dropped', dropData);
    },


    /**
     * When the game is over
     *
     * @param {Object} oldPos
     * @param {Object} newPos
     */
    gameOver: function (oldPos, newPos) {
      var oldPositions = this._mapPiecePositions(oldPos);
      var newPositions = this._mapPiecePositions(newPos);
      var capturedPieceDiff = _.difference(oldPositions, newPositions);
      var capturedPieceDiffSplit = [];
      var winningData = {};

      // See if there was a single last move before the win
      if (capturedPieceDiff.length == 1) {
        capturedPieceDiffSplit = capturedPieceDiff[0].split(':');

        if (capturedPieceDiffSplit[1].search(/^b/) !== -1) {
          winningData = {
            draw: false,
            winner: 'black',
            loser: 'white'
          };
        } else {
          winningData = {
            draw: false,
            winner: 'white',
            loser: 'black'
          };
        }

      } else if (whitePiecesCount < blackPiecesCount) {
        winningData = {
          draw: false,
          winner: 'black',
          loser: 'white'
        };
      } else if (blackPiecesCount < whitePiecesCount) {
        winningData = {
          draw: false,
          winner: 'white',
          loser: 'black'
        };
      }

      console.log('Game over!', winningData);

      // Publish the dropped event
      Bulletin.publish('game_over', winningData);
    },


    /**
     * Counts how many pieces a side has
     *
     * @param {Object} pieces
     * @param {String} colour
     * @return {Number}
     */
    _countPieces: function (pieces, colour) {
      var re = colour === 'white' ? /^w/ : /^b/;
      var count = 0;

      for (var i in pieces) {
        var p = pieces[i];

        if (p.search(re) !== -1) {
          count += 1;
        }
      }

      return count;
    },


    /**
     * Works out whose turn it was when a capture was done
     *
     * @param {Array} capturedDiff
     * @param {Number} whiteCount
     * @param {Number} blackCount
     * @return {Array}
     */
    _getCaptureData: function (capturedDiff, whiteCount, blackCount) {
      var move1Data = capturedDiff[0].split(':');
      var move2Data = capturedDiff[1].split(':');
      var captureData = {};

      if (whiteCount < whitePiecesCount) {
        console.log('black captured white');

        captureData = {
          captor: move1Data[1],
          captured: move2Data[1],
          moveStart: move1Data[0],
          moveEnd: move2Data[0]
        };
      } else if (blackCount < blackPiecesCount) {
        console.log('white captured black');

        captureData = {
          captor: move2Data[1],
          captured: move1Data[1],
          moveStart: move2Data[0],
          moveEnd: move1Data[0]
        };
      }

      return captureData;
    },


    /**
     * Maps a positions objects in to an array
     *
     * @param {Object} obj
     * @return {Array}
     */
    _mapPiecePositions: function (obj) {
      return _.map(obj, function (val, idx) {
        return idx + ':' + val;
      });
    },
  };

  window.EventsLib = eventsLib;
}());

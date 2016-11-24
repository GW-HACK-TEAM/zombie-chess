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
     * When a piece is dropped
     *
     * @param {String} source
     * @param {String} target
     */
    dropped: function (source, target, snapback) {

      // Publish the dropped event
      Bulletin.publish('dropped', {
        from: source,
        to: target,
        snapback: snapback
      });
    },


    /**
     * When a piece is dropped
     *
     * @param {String} source
     * @param {String} target
     */
    gameOver: function (source, target, snapback) {

      // Publish the dropped event
      Bulletin.publish('game_over');
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

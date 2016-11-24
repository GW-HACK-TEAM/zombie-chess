!(function () {
  var eventsLib = {

    /**
     * When a piece is captured
     *
     * @param {Object} oldPos
     * @param {Object} newPos
     */
    captured: function (oldPos, newPos) {
      let oldPositions = this._mapPiecePositions(oldPos);
      let newPositions = this._mapPiecePositions(newPos);
      let capturedPiece = [];
      let capturedPieceObj = {};
      let captorData = [];
      let capturedData = [];


      // If a piece is captured, work out which piece it was
      if (oldPositions.length != newPositions.length) {

        // Find the differences
        capturedPiece = _.difference(oldPositions, newPositions);

        // Get the move data out of the string
        captorData = capturedPiece[0].split(':');
        capturedData = capturedPiece[1].split(':');

        // Create captured data
        capturedPieceObj = {
          captor: captorData[1],
          captured: capturedData[1],
          moveStart: captorData[0],
          moveEnd: capturedData[0]
        };

        // Publish the capture content
        Bulletin.publish('captured', capturedPieceObj);
      }
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

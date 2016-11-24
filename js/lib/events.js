(function () {
  var eventsLib = {

    /**
     * When a piece is captured
     *
     * @param {Object} oldPos
     * @param {Object} newPos
     */
    captured: function (oldPos, newPos) {
      console.log("Old position: ", oldPos);
      console.log("New position: ", newPos);
      console.log(' ');
    },

  };

  window.EventsLib = eventsLib;
}());

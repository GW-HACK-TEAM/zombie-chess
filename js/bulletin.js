/* global _ */
!(function() {
var newsStand = {};

var _api = {
  subscribe: function(publication, fn) {
    var index;
    if (!_(newsStand).has(publication)) {
      newsStand[publication] = [];
    }
    index = newsStand[publication].push(fn) - 1;

    // Provide handle back for removal of subscription
    return {
      remove: function() {
        delete newsStand[publication][index];
      }
    };
  },

  /**
   * subscribeOnce
   *
   * @desc Wraps a function in a helkper that will remove itself after
   * being invoked.
   * @param fn
   * @param publication
   */
  subscribeOnce: function(fn, publication) {
    var index;
    var _fn;
    if (!_(newsStand).has(publication)) {
      newsStand[publication] = [];
    }
    index = newsStand[publication].length;

    _fn = function() {
      fn.apply(null, _.drop(arguments));
      delete newsStand[publication][index];
      console.log(newsStand);
    };

    newsStand[publication].push(_fn);
  },

  /**
   * publish
   * @desc fires all subscribed function for a specified publication.
   * Additional arguments passed to publish() will be forwarded on to the
   * subscribed function.
   * @param {string} publication - a string value representing a publication.
   * @return {boolean} - true if the publish succeeded, false otherwise.
   */
  publish: function(publication) {
    var payload = _.drop(arguments);
    if (_(newsStand).has(publication)) {
      newsStand[publication].forEach(function(subscriber) {
        if (!_.isUndefined(subscriber)) {
          subscriber.apply(null, payload);
        }
      });
      return true;
    } else {
      console.log('%c The publication "' + publication +
        '" that you want to publish has no subscribers.',
        'color: #f37124');
        return false;
    }
  },
  getPublications: function() {
    return _.keys(newsStand);
  }
};

window.Bulletin = _api;
}());

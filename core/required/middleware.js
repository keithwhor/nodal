'use strict';

module.exports = class Middleware {

  exec(controller, data, fnComplete) {

    var err = null;
    return fnComplete(err, data);

  }

};

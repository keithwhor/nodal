'use strict';

const Nodal = require('nodal');

class DummyTask {

  exec(args, callback) {

    console.log('Dummy task executed');
    callback();

  }

}

module.exports = DummyTask;

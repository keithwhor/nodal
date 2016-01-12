module.exports = (() => {

  'use strict';

  const Command = require('./command.js');

  class DatabaseCommand extends Command {

    constructor(name, options, fn) {
      super('db', name, options, fn);
      this._order = 10;
    }

  }

  return DatabaseCommand;

})();

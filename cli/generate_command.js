module.exports = (() => {

  'use strict';

  const Command = require('./command.js');

  class GenerateCommand extends Command {

    constructor(name, options, fn) {
      super('g', name, options, fn);
      this._order = 20;
    }

  }

  return GenerateCommand;

})();

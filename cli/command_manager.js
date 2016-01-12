module.exports = (() => {

  'use strict';

  class CommandManager {

    constructor() {

      this.map = new Map();

    }

    add(command) {

      this.map.set(command.index(), command);

    }

  }

  return CommandManager;

})();

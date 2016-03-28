module.exports = (() => {

  'use strict';

  const Command = require('cmnd').Command;

  class ServerCommand extends Command {

    constructor() {

      super('s');

    }

    help() {

      return {
        description: 'Starts your Nodal Server'
      };

    }

    run(args, flags, vflags, callback) {

      let spawn = require('cross-spawn-async');
      let child = spawn('npm',  ['start'], {stdio: 'inherit'});

      process.on('exit', function() {
        child && child.kill();
      });

    }

  }

  return ServerCommand;

})();

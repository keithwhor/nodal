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

  run(params, callback) {

    let spawn = require('cross-spawn-async');
    let child = spawn('npm',  ['start'], {stdio: 'inherit'});

    process.on('exit', function() {
      child && child.kill();
    });

  }

}

module.exports = ServerCommand;

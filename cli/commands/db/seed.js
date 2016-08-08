'use strict';

const Command = require('cmnd').Command;

class DBSeedCommand extends Command {

  constructor() {

    super('db', 'seed');

  }

  help() {

    return {
      description: `Seeds the database with data in './config/seed.json'`
    };

  }

  run(params, callback) {

    const bootstrapper = require('../../../core/my/bootstrapper.js');
    bootstrapper.seed(callback);

  }

}

module.exports =  DBSeedCommand;

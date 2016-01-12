module.exports = (() => {

  'use strict';

  const DatabaseCommand = require('../../database_command.js');
  const fs = require('fs');
  const ModelFactory = require('../../../core/required/model_factory.js');

  return new DatabaseCommand(
    'seed',
    {definition: 'Populate database with default data'},
    (args, flags, callback) => {

      let seedExists = fs.existsSync('./db/seed.json');

      if (!seedExists) {
        return callback(new Error('Could not seed, "./db/seed.json" does not exist.'));
      }

      let seed = fs.readFileSync('./db/seed.json').toString();

      try {
        seed = JSON.parse(seed);
      } catch (e) {
        return callback(new Error('Could not parse "./db/seed.json"'));
      }

      return ModelFactory.populate(seed, callback);

    }
  );

})();

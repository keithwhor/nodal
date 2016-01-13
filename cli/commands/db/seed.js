module.exports = (() => {

  'use strict';

  const Nodal = require('nodal');

  const DatabaseCommand = require('../../database_command.js');
  const fs = require('fs');
  const ModelFactory = require('../../../core/required/model_factory.js');

  return new DatabaseCommand(
    'seed',
    {definition: 'Populate database with default data'},
    (args, flags, callback) => {

      let seed = Nodal.my.Config.seed;

      if (!seed) {
        return callback(new Error('Could not seed, no seed found in "./config/seed.json"'));
      }

      return ModelFactory.populate(seed, callback);

    }
  );

})();

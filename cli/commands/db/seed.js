module.exports = (() => {

  'use strict';

  const DatabaseCommand = require('../../database_command.js');

  const bootstrapper = require('../../../core/my/bootstrapper.js');

  return new DatabaseCommand(
    'seed',
    {definition: 'Populate database with default data'},
    (args, flags, callback) => {

      bootstrapper.seed(callback);

    }
  );

})();

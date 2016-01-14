module.exports = (() => {

  'use strict';

  const DatabaseCommand = require('../../database_command.js');

  return new DatabaseCommand(
    'seed',
    {definition: 'Populate database with default data'},
    (args, flags, callback) => {

      const bootstrapper = require('../../../core/my/bootstrapper.js');
      bootstrapper.seed(callback);

    }
  );

})();

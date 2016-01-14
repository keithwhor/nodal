module.exports = (() => {

  'use strict';

  const DatabaseCommand = require('../../database_command.js');

  const bootstrapper = require('../../../core/my/bootstrapper.js');

  return new DatabaseCommand(
    'drop',
    {hidden: true},
    (args, flags, callback) => {

      bootstrapper.drop(callback);

    }
  );

})();

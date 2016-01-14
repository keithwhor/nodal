module.exports = (() => {

  'use strict';

  const DatabaseCommand = require('../../database_command.js');

  const bootstrapper = require('../../../core/my/bootstrapper.js');

  return new DatabaseCommand(
    'version',
    {hidden: true},
    (args, flags, callback) => {

      bootstrapper.version(callback);

    }
  );

})();

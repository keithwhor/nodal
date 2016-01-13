module.exports = (() => {

  'use strict';

  const DatabaseCommand = require('../../database_command.js');
  const fs = require('fs');
  const async = require('async');

  let createCommand = require('./create.js');
  let prepareCommand = require('./prepare.js');
  let migrateCommand = require('./migrate.js');
  let seedCommand = require('./seed.js');

  return new DatabaseCommand(
    'bootstrap',
    {definition: 'Runs db:create, db:prepare, db:migrate, db:seed'},
    (args, flags, callback) => {

      createCommand.exec(args, flags, (err) => {

        async.series(
          [prepareCommand, migrateCommand, seedCommand].map(f => {
            return cb => {
              f.exec(args, flags, cb);
            }
          }),
          callback
        );

      });

    }
  );

})();

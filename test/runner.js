"use strict";

let child_process = require('child_process');
let os = require('os');

describe('Test Suite', function() {

  let Nodal = require('../core/module.js');
  Nodal.env.rootDirectory = __dirname;

  if(os.platform() === 'win32') {
    // `psql` can take a long time to respond to a request on Windows
    // Here we pass a ~15 seconds timeout to allow for the
    // child process to exit gracefully or timeout.
    let processOptions = {
      timeout: 14900
    };

    before(function(done) {
      this.timeout(30000); // Set timeout to 30 seconds
      if (Nodal.env.name === 'development') {
        // Using async exec here to easily handler stderr
        // Errors are not thrown and instead are treated as warnings
        child_process.exec('psql -q -c "drop database if exists nodal_test;" -U postgres', processOptions, function(error, stdout, stderr) {
          if(error) console.warn("Warning:", stderr, "\nErrors ignored.");
          //
          child_process.exec('psql -a -c "create database nodal_test;" -U postgres', processOptions, function(error, stdout, stderr) {
            if(error) console.warn("Warning:", stderr, "\nErrors ignored.");
            done();
          });
        });
      }
    });

    after(function(done) {
      this.timeout(30000); // Set timeout to 30 seconds
      if (Nodal.env.name === 'development') {
        // Don't remove the -q option, it will break the db connection pool
        child_process.exec('psql -q -c "drop database if exists nodal_test;" -U postgres', processOptions, function(error, stdout, stderr) {
          if(error) console.warn("Warning:", stderr, "\nErrors ignored.");
          done();
        });
      }
    });
  }else{
    before(function() {
      if (Nodal.env.name === 'development') {
        // child_process.execSync('createuser postgres -s -q');
        child_process.execSync('psql -c \'drop database if exists nodal_test;\' -U postgres');
        child_process.execSync('psql -c \'create database nodal_test;\' -U postgres');
      }
    });

    after(function() {
      if (Nodal.env.name === 'development') {
        child_process.execSync('psql -c \'drop database if exists nodal_test;\' -U postgres');
      }
    });
  }


  require('./tests/nodal.js')(Nodal);

  require('./tests/database.js')(Nodal);

  require('./tests/model.js')(Nodal);

  require('./tests/application.js')(Nodal);

  require('./tests/composer.js')(Nodal);

});

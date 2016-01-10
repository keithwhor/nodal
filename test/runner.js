"use strict";

let child_process = require('child_process');
let os = require('os');

global.env = process.env.NODE_ENV || 'development';

describe('Test Suite', function() {

  let Nodal = require('../core/module.js');
  Nodal.rootDirectory = __dirname;
  
  // `psql` can take a long time to respond to a request on Windows
  // Here we pass a ~15 seconds timeout to allow for the
  // child process to exit gracefully or timeout.
  let processOptions = {
    timeout: 14900
  };
  
  let commandTable = {
    "drop": 'psql -c \'drop database if exists nodal_test;\' -U postgres',
    "create": "psql -c \'create database nodal_test;\' -U postgres",
    "WIN32": {
      "drop": 'psql -q -c "drop database if exists nodal_test;" -U postgres',
      "create": 'psql -a -c "create database nodal_test;" -U postgres'
    }
  };
  
  let getOSCommand = function (command) {
    if(os.platform() === 'win32') {
      return commandTable.WIN32[command];
    }else{
      return commandTable[command];
    }
  };

  before(function(done) {
    this.timeout(30000); // Set timeout to 30 seconds
    if (global.env === 'development') {
      // Using async exec here to easily handler stderr
      // Errors are not thrown and instead are treated as warnings
      child_process.exec(getOSCommand("drop"), processOptions, function(error, stdout, stderr) {
        if(error) console.warn("Warning:", stderr, "\nErrors ignored.");
        // 
        child_process.exec(getOSCommand("create"), processOptions, function(error, stdout, stderr) {
          if(error) console.warn("Warning:", stderr, "\nErrors ignored.");
          done();
        });
      });
    }
  });

  after(function(done) {
    this.timeout(30000); // Set timeout to 30 seconds
    if (global.env === 'development') {
      // Don't remove the -q option, it will break the db connection pool
      child_process.exec(getOSCommand("drop"), processOptions, function(error, stdout, stderr) {
        if(error) console.warn("Warning:", stderr, "\nErrors ignored.");
        done();
      });
    }
  });

  require('./tests/nodal.js')(Nodal);

  require('./tests/database.js')(Nodal);

  require('./tests/model.js')(Nodal);

  require('./tests/application.js')(Nodal);

  require('./tests/composer.js')(Nodal);

});

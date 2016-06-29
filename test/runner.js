'use strict';

let child_process = require('child_process');
let os = require('os');

let args = [];

try {
  args = JSON.parse(process.env.npm_config_argv);
  args = args.original.slice(1);
} catch (e) {
  args = [];
}

describe('Test Suite', function() {

  process.env.ROOT_DIRECTORY = __dirname;
  let Nodal = require('../core/module.js');

  if (os.platform() === 'win32') {
    // `psql` can take a long time to respond to a request on Windows
    // Here we pass a ~15 seconds timeout to allow for the
    // child process to exit gracefully or timeout.
    let processOptions = {
      timeout: 14900
    };

    before((done) => {
      this.timeout(30000); // Set timeout to 30 seconds
      if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
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

    after((done) => {
      this.timeout(30000); // Set timeout to 30 seconds
      if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
        // Don't remove the -q option, it will break the db connection pool
        child_process.exec('psql -q -c "drop database if exists nodal_test;" -U postgres', processOptions, function(error, stdout, stderr) {
          if(error) console.warn("Warning:", stderr, "\nErrors ignored.");
          done();
        });
      }
    });

  } else {

    before(() => {
      if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
        this.timeout(30000);
        // child_process.execSync('createuser postgres -s -q');
        child_process.execSync('psql -c \'drop database if exists nodal_test;\' -U postgres');
        child_process.execSync('psql -c \'create database nodal_test;\' -U postgres');
      }
    });

    after(() => {
      this.timeout(30000);
      if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
        child_process.execSync('psql -c \'drop database if exists nodal_test;\' -U postgres');
      }
    });

  }

  if (args.length && args[0].indexOf('--') === 0) {

    require(`./tests/${args[0].substr(2)}.js`)(Nodal);

  } else {

    [
      'nodal',
      'database',
      'api',
      'model',
      'composer',
      'relationship_graph',
      'graph_query'
    ].forEach(filename => require(`./tests/${filename}.js`)(Nodal));

  }

});

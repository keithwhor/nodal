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
      if (Nodal.env.name === 'production') {
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
      if (Nodal.env.name === 'production') {
        // Don't remove the -q option, it will break the db connection pool
        child_process.exec('psql -q -c "drop database if exists nodal_test;" -U postgres', processOptions, function(error, stdout, stderr) {
          if(error) console.warn("Warning:", stderr, "\nErrors ignored.");
          done();
        });
      }
    });

  } else {

    before(function() {
      if (Nodal.env.name === 'production') {
        // child_process.execSync('createuser postgres -s -q');
        child_process.execSync('psql -c \'drop database if exists nodal_test;\' -U postgres');
        child_process.execSync('psql -c \'create database nodal_test;\' -U postgres');
      }
    });

    after(function() {
      if (Nodal.env.name === 'production') {
        child_process.execSync('psql -c \'drop database if exists nodal_test;\' -U postgres');
      }
    });

  }

  if (args.length && args[0].indexOf('--') === 0) {

    require(`./tests/${args[0].substr(2)}.js`)(Nodal);

  } else {

    require('./tests/nodal.js')(Nodal);

    require('./tests/database.js')(Nodal);

    require('./tests/api.js')(Nodal);

    require('./tests/controller.js')(Nodal);

    require('./tests/model.js')(Nodal);

    require('./tests/composer.js')(Nodal);

    require('./tests/relationship_graph.js')(Nodal);

    require('./tests/strong_param.js')(Nodal);

    require('./tests/utilities.js')(Nodal);

    require('./tests/graph_query.js')(Nodal);

  }

});

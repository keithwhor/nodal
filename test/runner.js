"use strict";

let child_process = require('child_process');

global.env = process.env.NODE_ENV || 'development';

describe('Test Suite', function() {

  let Nodal = require('../core/module.js');
  Nodal.rootDirectory = __dirname;

  before(function() {
    if (global.env === 'development') {
      // child_process.execSync('createuser postgres -s -q');
      child_process.execSync('psql -c \'drop database if exists nodal_test;\' -U postgres');
      child_process.execSync('psql -c \'create database nodal_test;\' -U postgres');
    }
  });

  after(function() {
    if (global.env === 'development') {
      child_process.execSync('psql -c \'drop database if exists nodal_test;\' -U postgres');
    }
  });

  require('./tests/nodal.js')(Nodal);

  require('./tests/database.js')(Nodal);

  require('./tests/model.js')(Nodal);

  require('./tests/application.js')(Nodal);

  require('./tests/composer.js')(Nodal);

});

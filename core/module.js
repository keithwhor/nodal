'use strict';

// This will load dotenv / etc.
const fxn  = require('fxn');

let types = require('pg').types;
types.setTypeParser(20, function(val) {
  return val === null ? null : parseInt(val);
}); // 64-bit integer
types.setTypeParser(1700, function(val) {
  return val === null ? null : parseFloat(val);
}); // type NUMERIC

let Nodal = {
  API: null,
  APIResource: null,
  Application: null,
  Controller: null,
  CLI: null,
  Daemon: null,
  Database: null,
  GraphQuery: null,
  ItemArray: null,
  Migration: null,
  Mime: null,
  Model: null,
  ModelArray: null,
  ModelFactory: null,
  RelationshipGraph: null,
  Router: null,
  Scheduler: null,
  SchemaGenerator: null,
  my: {
    Config: null,
    Schema: null,
    bootstrapper: null
  },
  mocha: {
    Test: null,
    TestRunner: null
  }
};

/* Lazy Loading */

let LazyNodal = {
  my: {},
  mocha: {},
  require: function(filename) {
    return require(process.cwd() + '/' + filename);
  },
  include: {
    mime: require('mime-types'),
    inflect: require('i')()
  },
  env: require('./env.js')()
};

Object.defineProperties(LazyNodal, {
  API: {
    get: function() {
      return Nodal.API || (Nodal.API = require('./required/api.js'));
    },
    enumerable: true
  },
  APIResource: {
    get: function() {
      return Nodal.APIResource || (Nodal.APIResource = require('api-res'));
    }
  },
  Application: {
    get: function() {
      return Nodal.Application || (Nodal.Application = require('./required/application.js'));
    },
    enumerable: true
  },
  Controller: {
    get: function() {
      return Nodal.Controller || (Nodal.Controller = require('./required/controller.js'));
    },
    enumerable: true
  },
  CLI: {
    get: function() {
      return Nodal.CLI || (Nodal.CLI = require('../cli/cli.js'));
    },
    enumerable: true
  },
  Daemon: {
    get: function() {
      return Nodal.Daemon || (Nodal.Daemon = require('./required/daemon.js'));
    },
    enumerable: true
  },
  Database: {
    get: function() {
      return Nodal.Database || (Nodal.Database = require('./required/db/database.js'));
    },
    enumerable: true
  },
  GraphQuery: {
    get: function() {
      return Nodal.GraphQuery || (Nodal.GraphQuery = require('./required/graph_query.js'));
    },
    enumerable: true
  },
  ItemArray: {
    get: function() {
      return Nodal.ItemArray || (Nodal.ItemArray = require('./required/item_array.js'));
    },
    enumerable: true
  },
  Migration: {
    get: function() {
      return Nodal.Migration || (Nodal.Migration = require('./required/db/migration.js'));
    },
    enumerable: true
  },
  Mime: {
    get: function() {
      return Nodal.Mime || (Nodal.Mime = require('./required/mime.js'));
    },
    enumerable: true
  },
  Model: {
    get: function() {
      return Nodal.Model || (Nodal.Model = require('./required/model.js'));
    },
    enumerable: true
  },
  ModelArray: {
    get: function() {
      return Nodal.ModelArray || (Nodal.ModelArray = require('./required/model_array.js'));
    },
    enumerable: true
  },
  ModelFactory: {
    get: function() {
      return Nodal.ModelFactory || (Nodal.ModelFactory = require('./required/model_factory.js'));
    },
    enumerable: true
  },
  RelationshipGraph: {
    get: function() {
      return Nodal.RelationshipGraph || (Nodal.RelationshipGraph = require('./required/relationship_graph.js'));
    },
    enumerable: true
  },
  Router: {
    get: function() {
      return Nodal.Router || (Nodal.Router = require('./required/router.js'));
    },
    enumerable: true
  },
  Scheduler: {
    get: function() {
      return Nodal.Scheduler || (Nodal.Scheduler = require('./required/scheduler.js'));
    },
    enumerable: true
  },
  SchemaGenerator: {
    get: function() {
      return Nodal.SchemaGenerator || (Nodal.SchemaGenerator = require('./required/db/schema_generator.js'));
    },
    enumerable: true
  }
});

Object.defineProperties(LazyNodal.my, {
  Config: {
    get: function() {
      return Nodal.my.Config || (Nodal.my.Config = require('./my/config.js'));
    },
    enumerable: true
  },
  Schema: {
    get: function() {
      return Nodal.my.Schema || (Nodal.my.Schema = require('./my/schema.js'));
    },
    enumerable: true
  },
  bootstrapper: {
    get: function() {
      return Nodal.my.bootstrapper || (Nodal.my.bootstrapper = require('./my/bootstrapper.js'));
    },
    enumerable: true
  }
});

Object.defineProperties(LazyNodal.mocha, {
  Test: {
    get: function() {
      return Nodal.mocha.Test || (Nodal.mocha.Test = require('./mocha/test.js'));
    },
    enumerable: true
  },
  TestRunner: {
    get: function() {
      return Nodal.mocha.TestRunner || (Nodal.mocha.TestRunner = require('./mocha/test_runner.js'));
    },
    enumerable: true
  }
});

module.exports = LazyNodal;

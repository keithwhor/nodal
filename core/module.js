module.exports = (function() {

  'use strict';

  let types = require('pg').types;
  types.setTypeParser(20, function(val) {
    return val === null ? null : parseInt(val);
  }); // 64-bit integer
  types.setTypeParser(1700, function(val) {
    return val === null ? null : parseFloat(val);
  }); // type NUMERIC

  let Nodal = {
    API: null,
    Application: null,
    Authorizer: null,
    Composer: null,
    Controller: null,
    Daemon: null,
    Database: null,
    DummyRouter: null,
    Initializer: null,
    Middleware: null,
    Migration: null,
    Model: null,
    Router: null,
    Scheduler: null,
    SchedulerTask: null,
    SchemaGenerator: null,
    my: {
      Config: null,
      Schema: null
    }
  };

  /* Lazy Loading */

  let LazyNodal = {
    my: {},
    require: function(filename) {
      return require(process.cwd() + '/' + filename);
    },
    include: {
      mime: require('mime-types'),
      inflect: require('i')()
    },
    rootDirectory: process.cwd()
  };

  Object.defineProperties(LazyNodal, {
    API: {
      get: function() {
        return Nodal.API || (Nodal.API = require('./required/api.js'));
      },
      enumerable: true
    },
    Application: {
      get: function() {
        return Nodal.Application || (Nodal.Application = require('./required/application.js'));
      },
      enumerable: true
    },
    Authorizer: {
      get: function() {
        return Nodal.Authorizer || (Nodal.Authorizer = require('./required/authorizer.js'));
      },
      enumerable: true
    },
    Composer: {
      get: function() {
        return Nodal.Composer || (Nodal.Composer = require('./required/composer/composer.js'));
      },
      enumerable: true
    },
    Controller: {
      get: function() {
        return Nodal.Controller || (Nodal.Controller = require('./required/controller.js'));
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
    DummyRouter: {
      get: function() {
        return Nodal.DummyRouter || (Nodal.DummyRouter = require('./required/dummy_router.js'));
      },
      enumerable: true
    },
    Initializer: {
      get: function() {
        return Nodal.Initializer || (Nodal.Initializer = require('./required/initializer.js'));
      },
      enumerable: true
    },
    Middleware: {
      get: function() {
        return Nodal.Middleware || (Nodal.Middleware = require('./required/middleware.js'));
      },
      enumerable: true
    },
    Migration: {
      get: function() {
        return Nodal.Migration || (Nodal.Migration = require('./required/db/migration.js'));
      },
      enumerable: true
    },
    Model: {
      get: function() {
        return Nodal.Model || (Nodal.Model = require('./required/model.js'));
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
        return Nodal.Scheduler || (Nodal.Scheduler = require('./required/scheduler/scheduler.js'));
      },
      enumerable: true
    },
    SchedulerTask: {
      get: function() {
        return Nodal.Task || (Nodal.Task = require('./required/scheduler/task.js'));
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
        return Nodal.my.Config || (Nodal.my.Config = require('./required/my/config.js')(LazyNodal.rootDirectory));
      },
      enumerable: true
    },
    Schema: {
      get: function() {
        return Nodal.my.Schema || (Nodal.my.Schema = require('./required/my/schema.js')(LazyNodal.rootDirectory));
      },
      enumerable: true
    }
  });

  return LazyNodal;

})();

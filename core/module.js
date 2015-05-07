module.exports = (function() {

  var Nodal = {
    API: require('./required/api.js'),
    Application: require('./required/application.js'),
    Controller: require('./required/controller.js'),
    Database: require('./required/db/database.js'),
    Initializer: require('./required/initializer.js'),
    Middleware: require('./required/middleware.js'),
    Migration: require('./required/db/migration.js'),
    Model: require('./required/model.js'),
    Router: require('./required/router.js'),
    SchemaGenerator: require('./required/db/schema_generator.js'),
    require: function(filename) {
      return require(process.cwd() + '/' + filename);
    },
    include: {
      bcrypt: require('bcrypt'),
      mime: require('mime-types'),
      inflect: require('i')()
    },
    my: {}
  };

  /* Lazy load my.Config and my.Schema */

  var Config = null;
  var Schema = null;

  Object.defineProperties(Nodal.my, {
    Config: {
      get: function() {
        return Config || (Config = require('./required/my/config.js'));
      },
      enumerable: true
    },
    Schema: {
      get: function() {
        return Schema || (Schema = require('./required/my/schema.js'));
      },
      enumerable: true
    }
  });

  return Nodal;

})();

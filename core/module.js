module.exports = {
  Application: require('./required/application.js'),
  Config: require('./required/config.js'),
  Controller: require('./required/controller.js'),
  Database: require('./required/db/database.js'),
  Initializer: require('./required/initializer.js'),
  Middleware: require('./required/middleware.js'),
  Migration: require('./required/db/migration.js'),
  Model: require('./required/model.js'),
  Router: require('./required/router.js'),
  Schema: require('./required/db/schema.js'),
  SchemaGenerator: require('./required/db/schema_generator.js'),
  require: function(filename) {
    return require(process.cwd() + '/' + filename);
  }
};

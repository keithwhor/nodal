module.exports = {
  Application: require('./required/application.js'),
  Controller: require('./required/controller.js'),
  Model: require('./required/model.js'),
  Database: require('./required/db/database.js'),
  Migration: require('./required/db/migration.js'),
  SchemaGenerator: require('./required/db/schema_generator.js'),
  Schema: require('./required/db/schema.js'),
  Credentials: require('./required/db/credentials.js'),
  require: function(filename) {
    return require(process.cwd() + '/' + filename);
  }
};

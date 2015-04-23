module.exports = function() {

  var Database = require('./database.js');
  var SchemaGenerator = require('./schema_generator.js');

  var fs = require('fs');

  var colors = require('colors/safe');
  var inflect = require('i')();

  function Migration(db) {

    if (!(db instanceof Database)) {
      throw new Error('Migration required valid database instance');
    }

    this.id = null;

    this.db = db;

    this.schema = new SchemaGenerator();
    this.schema.load('db/schema.js');

  }

  Migration.prototype.executeUp = function(callback) {

    var up = this.up().concat([
      'INSERT INTO "schema_migrations"("id") VALUES(' + this.id + ')'
    ]);

    this.db.transaction(up.join(';'), callback);

  };

  Migration.prototype.executeDown = function(callback) {

    var down = this.down().concat([
      'DELETE FROM "schema_migrations" WHERE id = ' + this.id
    ]);

    this.db.transaction(down.join(';'), callback);

  };

  Migration.prototype.up = function() {

    return [];

  };

  Migration.prototype.down = function() {

    return [];

  };

  Migration.prototype.createTable = function(table, fieldData) {

    this.schema.createTable(table, fieldData);

    return this.db.adapter.generateCreateTableQuery(table, fieldData);

  };

  Migration.prototype.dropTable = function(table) {

    this.schema.dropTable(table);

    return this.db.adapter.generateDropTableQuery(table);

  };

  Migration.prototype.alterColumn = function(table, column, fieldData) {

    this.schema.alterColumn(table, column, fieldData);

    return this.db.adapter.generateAlterTableQuery(table, column, fieldData);

  };

  Migration.prototype.addColumn = function(table, fieldData) {

    /* not implemented */

  };

  return Migration;

};

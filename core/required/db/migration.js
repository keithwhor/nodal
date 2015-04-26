module.exports = (function() {

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

    this.schema = new SchemaGenerator(db);

  }

  Migration.prototype.up = function() {

    return [];

  };

  Migration.prototype.down = function() {

    return [];

  };

  Migration.prototype.executeUp = function(callback) {

    var schema = this.schema;

    schema.load();
    schema.setMigrationId(this.id);

    var up = this.up().concat([
      'INSERT INTO "schema_migrations"("id") VALUES(' + this.id + ')'
    ]);

    this.db.transaction(up.join(';'), function(err) {
      !err && schema.save();
      callback(err);
    });

  };

  Migration.prototype.executeDown = function(callback, prevId) {

    var schema = this.schema;
    schema.load();
    schema.setMigrationId(prevId || null);

    var down = this.down().concat([
      'DELETE FROM "schema_migrations" WHERE id = ' + this.id
    ]);

    this.db.transaction(down.join(';'), function(err) {
      !err && schema.save();
      callback(err);
    });

  };

  Migration.prototype.createTable = function(table, arrFieldData) {

    arrFieldData = this.schema.createTable(table, arrFieldData);

    return this.db.adapter.generateCreateTableQuery(table, arrFieldData);

  };

  Migration.prototype.dropTable = function(table) {

    this.schema.dropTable(table);

    return this.db.adapter.generateDropTableQuery(table);

  };

  Migration.prototype.alterColumn = function(table, column, type, properties) {

    this.schema.alterColumn(table, column, type, properties);

    return this.db.adapter.generateAlterTableQuery(table, column, type, properties);

  };

  Migration.prototype.addColumn = function(table, column, type, options) {

    this.schema.addColumn(table, column, type, options);

    return this.db.adapter.generateAlterTableAddColumnQuery(table, column, type, options);

  };

  Migration.prototype.dropColumn = function(table, column) {

    this.schema.dropColumn(table, column);

    return this.db.adapter.generateAlterTableDropColumnQuery(table, column);

  };

  Migration.prototype.renameColumn = function(table, column, newColumn) {

    this.schema.renameColumn(table, column, newColumn);

    return this.db.adapter.generateAlterTableRenameColumnQuery(table, column, newColumn);

  };

  Migration.prototype.createIndex = function(table, column, type) {

    return this.db.adapter.generateCreateIndexQuery(table, column, type);

  };

  Migration.prototype.dropIndex = function(table, column) {

    return this.db.adapter.generateDropIndexQuery(table, column);

  };

  return Migration;

})();

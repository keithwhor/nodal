module.exports = (function() {

  'use strict';

  const Database = require('./database.js');
  const SchemaGenerator = require('./schema_generator.js');

  const fs = require('fs');

  const colors = require('colors/safe');
  const inflect = require('i')();

  class Migration {

    constructor(db) {

      if (!(db instanceof Database)) {
        throw new Error('Migration required valid database instance');
      }

      this.id = null;

      this.db = db;

      this.schema = new SchemaGenerator(db);

    }

    up() {

      return [];

    }

    down() {

      return [];

    }

    executeUp(callback) {

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

    }

    executeDown(callback, prevId) {

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

    }

    createTable(table, arrFieldData) {

      arrFieldData = this.schema.createTable(table, arrFieldData);

      return this.db.adapter.generateCreateTableQuery(table, arrFieldData);

    }

    dropTable(table) {

      this.schema.dropTable(table);

      return this.db.adapter.generateDropTableQuery(table);

    }

    alterColumn(table, column, type, properties) {

      properties = properties || {};

      this.schema.alterColumn(table, column, type, properties);

      console.log('wat?', this.db.adapter.generateAlterTableQuery(table, column, type, properties));

      return this.db.adapter.generateAlterTableQuery(table, column, type, properties);

    }

    addColumn(table, column, type, properties) {

      properties = properties || {};

      this.schema.addColumn(table, column, type, properties);

      return this.db.adapter.generateAlterTableAddColumnQuery(table, column, type, properties);

    }

    dropColumn(table, column) {

      this.schema.dropColumn(table, column);

      return this.db.adapter.generateAlterTableDropColumnQuery(table, column);

    }

    renameColumn(table, column, newColumn) {

      this.schema.renameColumn(table, column, newColumn);

      return this.db.adapter.generateAlterTableRenameColumnQuery(table, column, newColumn);

    }

    createIndex(table, column, type) {

      return this.db.adapter.generateCreateIndexQuery(table, column, type);

    }

    dropIndex(table, column) {

      return this.db.adapter.generateDropIndexQuery(table, column);

    }

  };

  return Migration;

})();

'use strict';

const Database = require('./database.js');
const SchemaGenerator = require('./schema_generator.js');

const fs = require('fs');

const colors = require('colors/safe');
const inflect = require('i')();

class Migration {

  constructor(db) {

    if (!db) {
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

    let schema = this.schema;

    schema.fetch((function(err) {

      if (err) {
        return callback(err);
      }

      schema.setMigrationId(this.id);

      let up = this.up().concat([
        'INSERT INTO "schema_migrations"("id", "schema") VALUES(' + this.id + ', \'' + schema.generate() + '\')'
      ]);

      this.db.transaction(up.join(';'), function(err) {
        !err && schema.save();
        return callback(err);
      });

    }).bind(this));

  }

  executeDown(callback, prevId) {

    let schema = this.schema;

    schema.fetch((function(err) {

      if (err) {
        return callback(err);
      }

      schema.setMigrationId(prevId || null);

      let down = this.down().concat([
        'DELETE FROM "schema_migrations" WHERE id = ' + this.id
      ]);

      this.db.transaction(down.join(';'), function(err) {
        !err && schema.save();
        callback(err);
      });

    }).bind(this));

  }

  createTable(table, arrFieldData, modelName) {

    arrFieldData = this.schema.createTable(table, arrFieldData, modelName);

    return this.db.adapter.generateCreateTableQuery(table, arrFieldData);

  }

  dropTable(table) {

    this.schema.dropTable(table);

    return this.db.adapter.generateDropTableQuery(table);

  }

  renameTable(table, newTableName, renameModel, newModelName) {

    let modelSchema = this.schema.renameTable(table, newTableName, renameModel, newModelName);

    return this.db.adapter.generateAlterTableRename(table, newTableName, modelSchema.columns);

  }

  alterColumn(table, column, type, properties) {

    properties = properties || {};

    this.schema.alterColumn(table, column, type, properties);

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

    this.schema.createIndex(table, column, type);

    return this.db.adapter.generateCreateIndexQuery(table, column, type);

  }

  dropIndex(table, column) {

    this.schema.dropIndex(table, column);

    return this.db.adapter.generateDropIndexQuery(table, column);

  }

  addForeignKey(table, referenceTable) {

    if (this.db.adapter.supportsForeignKey) {
      this.schema.addForeignKey(table, referenceTable);
      return this.db.adapter.generateSimpleForeignKeyQuery(table, referenceTable);
    } else {
      throw new Error(`${this.db.adapter.constructor.name} does not support foreign keys`);
    }

  }

  dropForeignKey(table, referenceTable) {

    if (this.db.adapter.supportsForeignKey) {
      this.schema.dropForeignKey(table, referenceTable);
      return this.db.adapter.generateDropSimpleForeignKeyQuery(table, referenceTable);
    } else {
      throw new Error(`${this.db.adapter.constructor.name} does not support foreign keys`);
    }
  }


};

module.exports = Migration;

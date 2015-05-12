'use strict';

const DatabaseAdapter = require('../adapter.js');

class PostgresAdapter extends DatabaseAdapter {

  constructor() {

    super();

  }

  generateArray(arr) {

    return '{' + arr.join(',') + '}';

  }

  generateConnectionString(host, port, database, user, password) {

    return 'postgres://' + user + ':' + password + '@' + host + ':' + port + '/' + database;

  }

  generateColumn(columnName, columnType, columnProperties, isAlter) {

    isAlter = !!isAlter;

    return [
      this.escapeField(columnName),
      isAlter ? 'TYPE' : '',
      columnType,
      columnProperties.array ? 'ARRAY' : '',
      (columnProperties.primary_key || !columnProperties.nullable) ? 'NOT NULL' : ''
    ].filter(function(v) { return !!v; }).join(' ');

  }

  generateIndex(table, columnName) {

    return this.generateConstraint(table, columnName, 'index');

  }

  generateConstraint(table, columnName, suffix) {
    return this.escapeField([table, columnName, suffix].join('_'));
  }

  generatePrimaryKey(table, columnName) {

    return ['CONSTRAINT ', this.generateConstraint(table, columnName, 'pk'), ' PRIMARY KEY(', this.escapeField(columnName), ')'].join('');

  }

  generateUniqueKey(table, columnName) {

    return ['CONSTRAINT ', this.generateConstraint(table, columnName, 'unique'), ' UNIQUE(', this.escapeField(columnName), ')'].join('');

  }

  generateAlterTableColumnType(table, columnName, columnType, columnProperties) {

    return [
      'ALTER TABLE',
        this.escapeField(table),
      'ALTER COLUMN',
        this.generateColumn(columnName, columnType, columnProperties, true)
    ].join(' ');

  }

  generateAlterTableAddPrimaryKey(table, columnName) {

    return [
      'ALTER TABLE',
        this.escapeField(table),
      'ADD',
        this.generatePrimaryKey(table, columnName)
    ].join(' ');

  }

  generateAlterTableDropPrimaryKey(table, columnName) {

    return [
      'ALTER TABLE',
        this.escapeField(table),
      'DROP CONSTRAINT IF EXISTS',
        this.generateConstraint(table, columnName, 'pk')
    ].join(' ');

  }

  generateAlterTableAddUniqueKey(table, columnName) {

    return [
      'ALTER TABLE',
        this.escapeField(table),
      'ADD',
        this.generateUniqueKey(table, columnName)
    ].join(' ');

  }

  generateAlterTableDropUniqueKey(table, columnName) {

    return [
      'ALTER TABLE',
        this.escapeField(table),
      'DROP CONSTRAINT IF EXISTS',
        this.generateConstraint(table, columnName, 'unique')
    ].join(' ');

  }

  generateAlterTableAddColumn(table, columnName, columnType, columnProperties) {

    return [
      'ALTER TABLE',
        this.escapeField(table),
      'ADD COLUMN',
        this.generateColumn(columnName, columnType, columnProperties)
    ].join(' ');

  }

  generateAlterTableDropColumn(table, columnName) {

    return [
      'ALTER TABLE',
        this.escapeField(table),
      'DROP COLUMN IF EXISTS',
        this.escapeField(columnName)
    ].join(' ');

  }

  generateAlterTableRenameColumn(table, columnName, newColumnName) {

    return [
      'ALTER TABLE',
        this.escapeField(table),
      'RENAME COLUMN',
        this.escapeField(columnName),
      'TO',
      this.escapeField(newColumnName)
    ].join(' ');

  }

  generateCreateIndex(table, columnName, indexType) {

    return [
      'CREATE INDEX',
        this.generateIndex(table, columnName),
      'ON',
        table,
      'USING',
        indexType,
      ['(', this.escapeField(columnName), ')'].join('')
    ].join(' ');

  }

  generateDropIndex(table, columnName) {

    return [
      'DROP INDEX', this.generateIndex(table, columnName)
    ].join(' ');

  }

}

PostgresAdapter.prototype.sanitizeType = {
  boolean: function(v) {
    return ['f', 't'][v | 0];
  }
}

PostgresAdapter.prototype.escapeFieldCharacter = '"';

PostgresAdapter.prototype.types = {
  serial: {
    dbName: 'BIGSERIAL',
    properties: {
      primary_key: true,
      nullable: false
    }
  },
  int: {
    dbName: 'BIGINT'
  },
  currency: {
    dbName: 'BIGINT'
  },
  float: {
    dbName: 'FLOAT'
  },
  string: {
    dbName: 'VARCHAR'
  },
  text: {
    dbName: 'TEXT'
  },
  datetime: {
    dbName: 'TIMESTAMP'
  },
  boolean: {
    dbName: 'BOOLEAN'
  }
};

module.exports = PostgresAdapter;

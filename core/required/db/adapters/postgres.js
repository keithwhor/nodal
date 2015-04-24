module.exports = (function() {

  var DatabaseAdapter = require('../adapter.js');

  function PostgresAdapter() {

    DatabaseAdapter.apply(this, arguments);

  }

  PostgresAdapter.prototype = Object.create(DatabaseAdapter.prototype);
  PostgresAdapter.prototype.constructor = PostgresAdapter;

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

  PostgresAdapter.prototype.sanitizeType = {
    boolean: function(v) {
      return ['f', 't'][v | 0];
    }
  };

  PostgresAdapter.prototype.generateArray = function(arr) {

    return '{' + arr.join(',') + '}';

  };

  PostgresAdapter.prototype.generateConnectionString = function(host, port, database, user, password) {

    return 'postgres://' + user + ':' + password + '@' + host + ':' + port + '/' + database;

  };

  PostgresAdapter.prototype.generateColumn = function(columnName, columnType, columnProperties) {

    return [
      this.escapeField(columnName),
      columnType,
      columnProperties.array ? 'ARRAY' : '',
      (columnProperties.primary_key || !columnProperties.nullable) ? 'NOT NULL' : ''
    ].filter(function(v) { return !!v; }).join(' ');

  };

  PostgresAdapter.prototype.generateConstraint = function(table, columnName, suffix) {
    return this.escapeField(table + '_' + columnName + '_' + suffix);
  };

  PostgresAdapter.prototype.generatePrimaryKey = function(table, columnName) {

    return ['CONSTRAINT ', this.generateConstraint(table, columnName, 'pk'), ' PRIMARY KEY(', this.escapeField(columnName), ')'].join('');

  };

  PostgresAdapter.prototype.generateUniqueKey = function(table, columnName) {

    return ['CONSTRAINT ', this.generateConstraint(table, columnName, 'unique'), ' UNIQUE(', this.escapeField(columnName), ')'].join('');

  };

  PostgresAdapter.prototype.generateAlterTableColumnType = function(table, columnName, columnType, columnProperties) {

    return [
      'ALTER TABLE',
        this.escapeField(table),
      'ALTER COLUMN',
        this.generateColumn(columnName, columnType, columnProperties)
    ].join(' ');

  };

  PostgresAdapter.prototype.generateAlterTableAddPrimaryKey = function(table, columnName) {

    return [
      'ALTER TABLE',
        this.escapeField(table),
      'ADD',
        this.generatePrimaryKey(table, columnName)
    ].join(' ');

  };

  PostgresAdapter.prototype.generateAlterTableDropPrimaryKey = function(table, columnName) {

    return [
      'ALTER TABLE',
        this.escapeField(table),
      'DROP CONSTRAINT IF EXISTS',
        this.generateConstraint(table, columnName, 'pk')
    ].join(' ');

  };

  PostgresAdapter.prototype.generateAlterTableAddUniqueKey = function(table, columnName) {

    return [
      'ALTER TABLE',
        this.escapeField(table),
      'ADD',
        this.generateUniqueKey(table, columnName)
    ].join(' ');

  };

  PostgresAdapter.prototype.generateAlterTableDropUniqueKey = function(table, columnName) {

    return [
      'ALTER TABLE',
        this.escapeField(table),
      'DROP CONSTRAINT IF EXISTS',
        this.generateConstraint(table, columnName, 'unique')
    ].join(' ');

  };

  PostgresAdapter.prototype.generateAlterTableAddColumn = function(table, columnName, columnType, columnProperties) {

    return [
      'ALTER TABLE',
        this.escapeField(table),
      'ADD COLUMN',
        this.generateColumn(columnName, columnType, columnProperties)
    ].join(' ');

  };

  PostgresAdapter.prototype.generateAlterTableDropColumn = function(table, columnName) {

    return [
      'ALTER TABLE',
        this.escapeField(table),
      'DROP COLUMN IF EXISTS',
        this.escapeField(columnName)
    ].join(' ');

  };

  DatabaseAdapter.prototype.generateAlterTableRenameColumn = function(table, columnName, newColumnName) {

    return [
      'ALTER TABLE',
        this.escapeField(table),
      'RENAME COLUMN',
        this.escapeField(columnName),
      'TO',
      this.escapeField(newColumnName)
    ].join(' ');

  };

  return PostgresAdapter;

})();

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
      field: 'BIGSERIAL',
      primary_key: true,
      nullable: false
    },
    int: {
      field: 'BIGINT'
    },
    float: {
      field: 'FLOAT'
    },
    string: {
      field: 'VARCHAR'
    },
    text: {
      field: 'TEXT'
    },
    datetime: {
      field: 'TIMESTAMP'
    },
    boolean: {
      field: 'BOOLEAN'
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

  PostgresAdapter.prototype.generateColumn = function(columnName, properties) {

    return [
      this.escapeField(columnName),
      properties.field,
      properties.array ? 'ARRAY' : '',
      (properties.primary_key || !properties.nullable) ? 'NOT NULL' : ''
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

  PostgresAdapter.prototype.generateAlterColumnType = function(table, columnName, properties) {

    return [
      'ALTER TABLE',
        this.escapeField(table),
      'ALTER COLUMN',
        this.generateColumn(columnName, properties)
    ].join(' ');

  };

  PostgresAdapter.prototype.generateAlterAddPrimaryKey = function(table, columnName) {

    return [
      'ALTER TABLE',
        this.escapeField(table),
      'ADD',
        this.generatePrimaryKey(table, columnName)
    ].join(' ');

  };

  PostgresAdapter.prototype.generateAlterDropPrimaryKey = function(table, columnName) {

    return [
      'ALTER TABLE',
        this.escapeField(table),
      'DROP CONSTRAINT IF EXISTS',
        this.generateConstraint(table, columnName, 'pk')
    ].join(' ');

  };

  PostgresAdapter.prototype.generateAlterAddUniqueKey = function(table, columnName) {

    return [
      'ALTER TABLE',
        this.escapeField(table),
      'ADD',
        this.generateUniqueKey(table, columnName)
    ].join(' ');

  };

  PostgresAdapter.prototype.generateAlterDropUniqueKey = function(table, columnName) {

    return [
      'ALTER TABLE',
        this.escapeField(table),
      'DROP CONSTRAINT IF EXISTS',
        this.generateConstraint(table, columnName, 'unique')
    ].join(' ');

  };

  return PostgresAdapter;

})();

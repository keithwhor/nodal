module.exports = (function() {

  var DatabaseAdapter = require('../adapter.js');

  function PostgresAdapter() {

    DatabaseAdapter.apply(this, arguments);

  }

  PostgresAdapter.prototype = Object.create(DatabaseAdapter.prototype);
  PostgresAdapter.prototype.constructor = PostgresAdapter;

  PostgresAdapter.prototype.escapeFieldCharacter = '"';

  PostgresAdapter.prototype.types = {
    index: {
      field: 'BIGSERIAL',
      primary_key: true,
      unique: true,
      nullable: false
    },
    int: {
      field: 'BIGINT',
    },
    float: {
      field: 'FLOAT',
    },
    string: {
      field: 'VARCHAR',
      length: 256,
    },
    text: {
      field: 'TEXT',
    },
    datetime: {
      field: 'TIMESTAMP',
    },
    boolean: {
      field: 'BOOLEAN',
      sanitize: function(v) {
        return ['f', 't'][v | 0];
      }
    }
  };

  PostgresAdapter.prototype.generateArray = function(arr) {

    return '{' + arr.join(',') + '}';

  };

  PostgresAdapter.prototype.generateConnectionString = function(host, port, database, user, password) {

    return 'postgres://' + user + ':' + password + '@' + host + ':' + port + '/' + database;

  };

  PostgresAdapter.prototype.generateColumn = function(column, type, properties) {

    return [
      this.escapeField(column),
      type.field,
      properties.array ? 'ARRAY' : '',
      (type.primary_key || !type.nullable) ? 'NOT NULL' : ''
    ].filter(function(v) { return !!v; }).join(' ');

  };

  PostgresAdapter.prototype.generateConstraint = function(table, column, suffix) {
    return this.escapeField(table + '_' + column + '_' + suffix);
  };

  PostgresAdapter.prototype.generatePrimaryKey = function(table, column) {

    return ['CONSTRAINT ', this.generateConstraint(table, column, 'pk'), ' PRIMARY KEY(', this.escapeField(column), ')'].join('');

  };

  PostgresAdapter.prototype.generateUniqueKey = function(table, column) {

    return ['CONSTRAINT ', this.generateConstraint(table, column, 'unique'), ' UNIQUE(', this.escapeField(column), ')'].join('');

  };

  PostgresAdapter.prototype.generateAlterColumnType = function(table, column, type, properties) {

    return [
      'ALTER TABLE',
        this.escapeField(table),
      'ALTER COLUMN',
        this.generateColumn(column, this.getType(fieldData.type), fieldData.properties)
    ].join(' ');

  };

  PostgresAdapter.prototype.generateAlterAddPrimaryKey = function(table, column) {

    return [
      'ALTER TABLE',
        this.escapeField(table),
      'ADD CONSTRAINT',
        this.generatePrimaryKey(table, column)
    ].join(' ');

  };

  PostgresAdapter.prototype.generateAlterDropPrimaryKey = function(table, column) {

    return [
      'ALTER TABLE',
        this.escapeField(table),
      'DROP CONSTRAINT IF EXISTS',
        this.generateConstraint(table, column, 'pk')
    ].join(' ');

  };

  PostgresAdapter.prototype.generateAlterAddUniqueKey = function(table, column) {

    return [
      'ALTER TABLE',
        this.escapeField(table),
      'ADD',
        this.generateUniqueKey(table, column)
    ].join(' ');

  };

  PostgresAdapter.prototype.generateAlterDropUniqueKey = function(table, column) {

    return [
      'ALTER TABLE',
        this.escapeField(table),
      'DROP CONSTRAINT IF EXISTS',
        this.generateConstraint(table, column, 'unique')
    ].join(' ');

  };

  return PostgresAdapter;

})();

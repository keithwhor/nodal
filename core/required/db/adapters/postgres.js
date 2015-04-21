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

  PostgresAdapter.prototype.generateField = function(field, type, properties) {

    return [
      this.escapeField(field),
      type.field,
      properties.array ? 'ARRAY' : '',
      type.nullable ? '' : 'NOT NULL'
    ].filter(function(v) { return !!v; }).join(' ');

  };

  PostgresAdapter.prototype.generatePrimaryKey = function(field, type, properties) {

    return ['PRIMARY KEY(', this.escapeField(field), ')'].join('');

  };

  PostgresAdapter.prototype.generateUniqueKey = function(field, type, properties) {

    return ['UNIQUE(', this.escapeField(field), ')'].join('');

  };

  return PostgresAdapter;

})();

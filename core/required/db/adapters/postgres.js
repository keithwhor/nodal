module.exports = (function() {

  var DatabaseAdapter = require('../adapter.js');

  function PostgresAdapter() {

    DatabaseAdapter.apply(this, arguments);

  };

  PostgresAdapter.prototype = Object.create(DatabaseAdapter.prototype);
  PostgresAdapter.prototype.constructor = PostgresAdapter;

  PostgresAdapter.prototype.escapeFieldCharacter = '"';

  PostgresAdapter.prototype.types = {
    index: {
      field: 'BIGSERIAL',
      primary_key: true,
      convert: function(v) {
        return v | 0;
      }
    },
    int: {
      field: 'BIGINT',
      convert: function(v) {
        return v | 0;
      }
    },
    float: {
      field: 'FLOAT',
      convert: function(v) {
        return parseFloat(v) || 0;
      }
    },
    string: {
      field: 'VARCHAR',
      length: 256,
      convert: function(v) {
        return v === null ? '' : (v + '');
      }
    },
    text: {
      field: 'TEXT',
      convert: function(v) {
        return v === null ? '' : (v + '');
      }
    },
    datetime: {
      field: 'TIMESTAMP',
      convert: function(v) {
        if(!(v instanceof Date)) {
          if(!isNaN(parseInt(v))) {
            v = new Date(parseInt(v));
          } else {
            v = new Date(v);
          }
          if(v.toString() === 'Invalid Date') {
            v = new Date(0);
          }
        }
        return v;
      }
    },
    boolean: {
      field: 'BOOLEAN',
      convert: function(v) {
        return [false, true][v === 't'];
      },
      sanitize: function(v) {
        return ['f', 't'][!{'f': 1,'false': 1,'n': 1,'no': 1,'off': 1,'0': 1}[v]];
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

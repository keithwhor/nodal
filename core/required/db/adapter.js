module.exports = (function() {

  function DatabaseAdapter() {

  }

  DatabaseAdapter.prototype.typeProperties = [
    'length',
    'nullable',
    'unique',
    'primary_key',
    'array',
    'defaultValue',
    'sanitize'
  ];

  DatabaseAdapter.prototype.typePropertyDefaults = {
    field: 'INTEGER',
    length: null,
    nullable: true,
    unique: false,
    primary_key: false,
    array: false,
    defaultValue: null,
    sanitize: function(v) { return v; }
  };

  DatabaseAdapter.prototype.types = {};
  DatabaseAdapter.prototype.escapeFieldCharacter = '';

  DatabaseAdapter.prototype.generateConnectionString = function(host, port, database, user, password) {};

  DatabaseAdapter.prototype.generateColumn = function(column, type, properties) {};
  DatabaseAdapter.prototype.generatePrimaryKey = function(column, type, properties) {};
  DatabaseAdapter.prototype.generateUniqueKey = function(column, type, properties) {};

  DatabaseAdapter.prototype.generateAlterColumnType = function(table, column, type, properties) {};
  DatabaseAdapter.prototype.generateAlterAddPrimaryKey = function(table, column) {};
  DatabaseAdapter.prototype.generateAlterDropPrimaryKey = function(table, column) {};
  DatabaseAdapter.prototype.generateAlterAddUniqueKey = function(table, column) {};
  DatabaseAdapter.prototype.generateAlterDropUniqueKey = function(table, column) {};

  DatabaseAdapter.prototype.escapeField = function(name) {
    return ['', name, ''].join(this.escapeFieldCharacter);
  };

  DatabaseAdapter.prototype.getTypeProperties = function(typeName, optionalValues) {
    var type = this.types[typeName];
    optionalValues = optionalValues || {};
    var outputType = Object.create(this.typePropertyDefaults);
    Object.keys(type).forEach(function(v) {
      outputType[v] = optionalValues.hasOwnProperty(v) ? optionalValues[v] : (type.hasOwnProperty(v) ? type[v] : outputType[v]);
    });
    return outputType;
  };

  DatabaseAdapter.prototype.generateColumnsStatement = function(table, fieldData) {
    var self = this;
    return fieldData
      .map(function(v) { return self.generateColumn(v.name, self.getTypeProperties(v.type, v)); })
      .join(',');
  };

  DatabaseAdapter.prototype.generatePrimaryKeysStatement = function(table, fieldData) {
    var self = this;
    return fieldData
      .filter(function(v) { return self.getTypeProperties(v.type, v).primary_key; })
      .map(function(v) { return self.generatePrimaryKey(table, v.name); })
      .join(',');
  };

  DatabaseAdapter.prototype.generateUniqueKeysStatement = function(table, fieldData) {
    var self = this;
    return fieldData
      .filter(
        function(v) {
          var type = self.getTypeProperties(v.type, fieldData);
          return (!type.primary_key && type.unique);
        }
      )
      .map(function(v) { return self.generateUniqueKey(table, v.name); })
      .join(',');
  };

  DatabaseAdapter.prototype.generateCreateTableQuery = function(table, fieldData) {

    return [
      'CREATE TABLE ',
        this.escapeField(table),
      '(',
        [
          this.generateColumnsStatement(table, fieldData),
          this.generatePrimaryKeysStatement(table, fieldData),
          this.generateUniqueKeysStatement(table, fieldData)
        ].filter(function(v) { return !!v; }).join(','),
      ')'
    ].join('');

  };

  DatabaseAdapter.prototype.generateDropTableQuery = function(table) {

    return [
      'DROP TABLE ', this.escapeField(table)
    ].join('');

  };

  DatabaseAdapter.prototype.generateInsertQuery = function(table, columns) {
    return [
      'INSERT INTO ',
        this.escapeField(table),
      '(',
        columns.map(this.escapeField.bind(this)).join(','),
      ') VALUES(',
        columns.map(function(v, i) { return '$' + (i + 1); }).join(','),
      ') RETURNING *'
    ].join('');
  };

  DatabaseAdapter.prototype.generateAlterTableQuery = function(table, column, fieldData) {

    var queries = [];

    if (fieldData.hasOwnProperty('type')) {
      queries.push(
        this.generateAlterColumnType(
          table,
          column,
          this.getTypeProperties(fieldData.type, fieldData)
        )
      );
    }

    if (fieldData.hasOwnProperty('primary_key')) {
      queries.push(
        [
          this.generateAlterDropPrimaryKey,
          this.generateAlterAddPrimaryKey
        ][fieldData.primary_key | 0].call(this, table, column)
      );
    } else if (fieldData.hasOwnProperty('unique')) {
      queries.push(
        [
          this.generateAlterDropUniqueKey,
          this.generateAlterAddUniqueKey
        ][fieldData.primary_key | 0].call(this, table, column)
      );
    }

    return queries.join(';');

  };

  return DatabaseAdapter;

})();

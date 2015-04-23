module.exports = (function() {

  function DatabaseAdapter() {

  }

  DatabaseAdapter.prototype.typeConfigurables = [
    'length',
    'nullable',
    'unique',
    'primary_key',
    'sanitize'
  ];

  DatabaseAdapter.prototype.typeConfigurableDefaults = {
    field: 'INTEGER',
    length: null,
    nullable: true,
    unique: false,
    primary_key: false,
    sanitize: function(v) { return v; }
  };

  DatabaseAdapter.prototype.fieldProperties = [
    'defaultValue',
    'array'
  ];

  DatabaseAdapter.prototype.fieldPropertyDefaults = {
    defaultValue: undefined,
    array: false
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

  DatabaseAdapter.prototype.getType = function(typeName, optionalValues) {
    var type = this.types[typeName];
    optionalValues = optionalValues || {};
    var outputType = Object.create(this.typeConfigurableDefaults);
    Object.keys(type).forEach(function(v) {
      outputType[v] = optionalValues.hasOwnProperty(v) ? optionalValues[v] : (type.hasOwnProperty(v) ? type[v] : outputType[v]);
    });
    return outputType;
  };

  DatabaseAdapter.prototype.parseProperties = function(properties) {

    var props = {};
    var defaultProps = this.fieldPropertyDefaults;

    this.fieldProperties.forEach(function(v) {
      props[v] = (properties && properties.hasOwnProperty(v)) ? properties[v] : defaultProps[v];
    });

    return props;

  };

  DatabaseAdapter.prototype.generateColumnsStatement = function(table, fieldData) {
    var self = this;
    return fieldData
      .map(function(v) { return self.generateColumn(v.name, self.getType(v.type), self.parseProperties(v.properties)); })
      .join(',');
  };

  DatabaseAdapter.prototype.generatePrimaryKeysStatement = function(table, fieldData) {
    var self = this;
    return fieldData
      .filter(function(v) { return self.getType(v.type, fieldData).primary_key; })
      .map(function(v) { return self.generatePrimaryKey(table, v.name); })
      .join(',');
  };

  DatabaseAdapter.prototype.generateUniqueKeysStatement = function(table, fieldData) {
    var self = this;
    return fieldData
      .filter(
        function(v) {
          var type = self.getType(v.type, fieldData);
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
          this.getType(fieldData.type),
          this.parseProperties(fieldData.properties)
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

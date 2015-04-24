module.exports = (function() {

  function DatabaseAdapter() {

  }

  DatabaseAdapter.prototype.typeProperties = [
    'length',
    'nullable',
    'unique',
    'primary_key',
    'array',
    'defaultValue'
  ];

  DatabaseAdapter.prototype.typePropertyDefaults = {
    length: null,
    nullable: true,
    unique: false,
    primary_key: false,
    array: false,
    defaultValue: null
  };

  DatabaseAdapter.prototype.types = {};
  DatabaseAdapter.prototype.sanitizeType = {};
  DatabaseAdapter.prototype.escapeFieldCharacter = '';

  DatabaseAdapter.prototype.generateConnectionString = function(host, port, database, user, password) {};

  DatabaseAdapter.prototype.generateColumn = function(columnName, type, properties) {};
  DatabaseAdapter.prototype.generatePrimaryKey = function(columnName, type, properties) {};
  DatabaseAdapter.prototype.generateUniqueKey = function(columnName, type, properties) {};

  DatabaseAdapter.prototype.generateAlterColumnType = function(table, columnName, type, properties) {};
  DatabaseAdapter.prototype.generateAlterAddPrimaryKey = function(table, columnName) {};
  DatabaseAdapter.prototype.generateAlterDropPrimaryKey = function(table, columnName) {};
  DatabaseAdapter.prototype.generateAlterAddUniqueKey = function(table, columnName) {};
  DatabaseAdapter.prototype.generateAlterDropUniqueKey = function(table, columnName) {};

  DatabaseAdapter.prototype.sanitize = function(type, value) {

    var fnSanitize = this.sanitizeType[type];
    return fnSanitize ? fnSanitize(value) : value;

  };

  DatabaseAdapter.prototype.escapeField = function(name) {
    return ['', name, ''].join(this.escapeFieldCharacter);
  };

  DatabaseAdapter.prototype.getTypeProperties = function(typeName, optionalValues) {

    var type = this.types[typeName];
    var typeProperties = type ? (type.properties || {}) : {};

    optionalValues = optionalValues || {};

    var outputType = Object.create(this.typePropertyDefaults);
    this.typeProperties.forEach(function(v) {
      if (optionalValues.hasOwnProperty(v)) {
        outputType[v] = optionalValues[v];
      } else if(typeProperties.hasOwnProperty(v)) {
        outputType[v] = typeProperties[v];
      }
    });

    return outputType;

  };

  DatabaseAdapter.prototype.getTypeDbName = function(typeName) {
    type = this.types[typeName];
    return type ? type.dbName : 'INTEGER';
  };

  DatabaseAdapter.prototype.generateColumnsStatement = function(table, columns) {
    var self = this;
    return columns
      .map(function(columnData) {
        return self.generateColumn(columnData.name, self.getTypeDbName(columnData.type), self.getTypeProperties(columnData.type, columnData.properties));
      })
      .join(',');
  };

  DatabaseAdapter.prototype.generatePrimaryKeysStatement = function(table, columns) {
    var self = this;
    return columns
      .filter(function(columnData) { return self.getTypeProperties(columnData.type, columnData.properties).primary_key; })
      .map(function(columnData) { return self.generatePrimaryKey(table, columnData.name); })
      .join(',');
  };

  DatabaseAdapter.prototype.generateUniqueKeysStatement = function(table, columns) {
    var self = this;
    return columns
      .filter(
        function(columnData) {
          var type = self.getTypeProperties(columnData.type, columnData.properties);
          return (!type.primary_key && type.unique);
        }
      )
      .map(function(columnData) { return self.generateUniqueKey(table, columnData.name); })
      .join(',');
  };

  DatabaseAdapter.prototype.generateCreateTableQuery = function(table, columns) {

    return [
      'CREATE TABLE ',
        this.escapeField(table),
      '(',
        [
          this.generateColumnsStatement(table, columns),
          this.generatePrimaryKeysStatement(table, columns),
          this.generateUniqueKeysStatement(table, columns)
        ].filter(function(v) { return !!v; }).join(','),
      ')'
    ].join('');

  };

  DatabaseAdapter.prototype.generateDropTableQuery = function(table) {

    return [
      'DROP TABLE ', this.escapeField(table)
    ].join('');

  };

  DatabaseAdapter.prototype.generateInsertQuery = function(table, columnNames) {
    return [
      'INSERT INTO ',
        this.escapeField(table),
      '(',
        columnNames.map(this.escapeField.bind(this)).join(','),
      ') VALUES(',
        columnNames.map(function(v, i) { return '$' + (i + 1); }).join(','),
      ') RETURNING *'
    ].join('');
  };

  DatabaseAdapter.prototype.generateAlterTableQuery = function(table, columnName, columnData) {

    var queries = [];

    if (columnData.hasOwnProperty('type')) {
      queries.push(
        this.generateAlterColumnType(
          table,
          columnName,
          this.getTypeDbName(columnData.type),
          this.getTypeProperties(columnData.type, columnData)
        )
      );
    }

    if (columnData.hasOwnProperty('primary_key')) {
      queries.push(
        [
          this.generateAlterDropPrimaryKey,
          this.generateAlterAddPrimaryKey
        ][columnData.primary_key | 0].call(this, table, columnName)
      );
    } else if (columnData.hasOwnProperty('unique')) {
      queries.push(
        [
          this.generateAlterDropUniqueKey,
          this.generateAlterAddUniqueKey
        ][columnData.primary_key | 0].call(this, table, columnName)
      );
    }

    return queries.join(';');

  };

  return DatabaseAdapter;

})();

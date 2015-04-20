module.exports = (function() {

  function DatabaseAdapter() {

  };

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

  DatabaseAdapter.prototype.generateField = function(field, type, properties) {};
  DatabaseAdapter.prototype.generatePrimaryKey = function(field, type, properties) {};
  DatabaseAdapter.prototype.generateUniqueKey = function(field, type, properties) {};

  DatabaseAdapter.prototype.escapeField = function(name) {
    return ['', name, ''].join(this.escapeFieldCharacter);
  };

  DatabaseAdapter.prototype.getType = function(typeName) {
    var type = this.types[typeName]
    var outputType = Object.create(this.typeConfigurableDefaults);
    Object.keys(type).forEach(function(v) {
      outputType[v] = type[v];
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

  DatabaseAdapter.prototype.generateFieldsStatement = function(fieldData) {
    var self = this;
    return fieldData
      .map(function(v) { return self.generateField(v.name, self.getType(v.type), self.parseProperties(v.properties)); })
      .join(',');
  };

  DatabaseAdapter.prototype.generatePrimaryKeysStatement = function(fieldData) {
    var self = this;
    return fieldData
      .filter(function(v) { return v.type.primary_key; })
      .map(function(v) { return self.generatePrimaryKey(v.name, self.getType(v.type), self.parseProperties(v.properties)); })
      .join(',')
  };

  DatabaseAdapter.prototype.generateUniqueKeysStatement = function(fieldData) {
    var self = this;
    return fieldData
      .filter(function(v) { return v.type.unique; })
      .map(function(v) { return self.generateUnique(v.name, self.getType(v.type), self.parseProperties(v.properties)); })
      .join(',')
  };

  DatabaseAdapter.prototype.generateCreateTableQuery = function(name, fieldData) {

    return [
      'CREATE TABLE ',
        this.escapeField(name),
      '(',
        [
          this.generateFieldsStatement(fieldData),
          this.generatePrimaryKeysStatement(fieldData),
          this.generateUniqueKeysStatement(fieldData)
        ].filter(function(v) { return !!v; }).join(','),
      ')'
    ].join('');

  };

  DatabaseAdapter.prototype.generateDropTableQuery = function(name) {

    return [
      'DROP TABLE ', this.escapeField(name)
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

  return DatabaseAdapter;

})();

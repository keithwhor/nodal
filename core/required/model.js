module.exports = (function() {

  var DataTypes = require('./data_types.js');

  function Model(modelData) {

    this.setSchema();

    modelData && this.load(modelData);

  }

  Model.prototype.setSchema = function(schema) {

    var fieldArray;

    if (schema) {

      fieldArray = schema.fields.slice();
      fieldArray.unshift({name: 'id', type: 'index'});
      fieldArray.push({name:'created_at', type: 'datetime'});
      this._table = schema.table;

    } else {

      fieldArray = this.schema.fields.slice();
      this._table = this.schema.table;

    }

    this._fieldArray = fieldArray;
    var fieldLookup = {};

    fieldArray.forEach(function(v) {
      fieldLookup[v.name] = v;
    });

    this._fieldLookup = fieldLookup;

    var data = {};

    this.fieldList().forEach(function(v) {
      data[v] = null;
    });

    this._data = data;
    this._errors = {};

    this.validate();

    return (this.schema = this.getSchema());

  };

  Model.prototype.getSchema = function() {

    return {
      table: this._table,
      fields: this._fieldArray.slice()
    };

  };

  Model.prototype.hasErrors = function() {

    return Object.keys(this._errors).length > 0;

  };

  Model.prototype.getErrors = function() {
    var obj = {};
    var errors = this._errors;
    Object.keys(errors).forEach(function(key) {
      obj[key] = errors[key];
    });
    return obj;
  };

  Model.prototype.validate = function(fieldList) {

    return (fieldList || this.fieldList()).filter(function(field) {

      // does nothing right now
      this.clearError(field);
      return false;

    }.bind(this)).length > 0;

  };

  Model.prototype.load = function(data) {

    var self = this;

    self.set('created_at', new Date());

    self.fieldList().filter(function(key) {
      return data.hasOwnProperty(key);
    }).forEach(function(key) {
      self.set(key, data[key]);
    });

    return this;

  };

  Model.prototype.set = function(field, value) {

    if (!this.hasField(field)) {

      throw new Error('Field ' + field + ' does not belong to model ' + this.constructor.name);

    }

    var dataType = this.getDataTypeOf(field);

    value = value === undefined ? value : null;

    if (value === null) {
      this._data[field] = null;
    } else {
      if (this.isFieldArray(field)) {
        value = value instanceof Array ? value : [value];
        this._data[field] = value.map(function(v) { return dataType.convert(v); });
      } else {
        this._data[field] = dataType.convert(value);
      }
    }

    this.validate([field]);

    return value;

  };

  Model.prototype.get = function(key) {
    var value = this._data[key];
    return value === undefined ? null : value;
  };

  Model.prototype.toObject = function() {
    var obj = {};
    var data = this._data;
    Object.keys(data).forEach(function(key) {
      obj[key] = data[key];
    });
    return obj;
  };

  Model.prototype.tableName = function() {
    return this._table;
  };

  Model.prototype.hasField = function(field) {
    return !!this._fieldLookup[field];
  };

  Model.prototype.getFieldData = function(field) {
    return this._fieldLookup[field];
  };

  Model.prototype.getDataTypeOf = function(field) {
    return DataTypes[this._fieldLookup[field].type];
  };

  Model.prototype.isFieldArray = function(field) {
    var fieldData = this._fieldLookup[field];
    return !!(fieldData && fieldData.properties && fieldData.properties.array);
  };

  Model.prototype.isFieldPrimaryKey = function(field) {
    var fieldData = this._fieldLookup[field];
    return !!(fieldData && fieldData.properties && fieldData.properties.primary_key);
  };

  Model.prototype.fieldDefaultValue = function(field) {
    var fieldData = this._fieldLookup[field];
    return !!(fieldData && fieldData.properties && fieldData.properties.array);
  };

  Model.prototype.fieldList = function() {
    return this._fieldArray.map(function(v) { return v.name; });
  };

  Model.prototype.fieldDefinitions = function() {
    return this._fieldArray.slice();
  };

  Model.prototype.error = function(key, message) {
    this._errors[key] = message;
    return true;
  };

  Model.prototype.clearError = function(key) {
    delete this._errors[key];
    return true;
  };

  Model.prototype.schema = {
    table: '',
    fields: []
  };

  Model.prototype.data = null;

  return Model;

})();

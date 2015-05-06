module.exports = (function() {

  var DataTypes = require('./data_types.js');
  var Database = require('./db/database.js');

  function Model(modelData, fromStorage) {

    this.initialize(fromStorage);

    modelData && this.load(modelData, fromStorage);

  }

  Model.prototype.validates = function(field, message, fnAction) {

    this._validations = this._validations || {};

    this._validations[field] = this._validations[field] || [];
    this._validations[field].push({message: message, action: fnAction});

  };

  Model.prototype.inStorage = function() {
    return this._inStorage;
  };

  Model.prototype.initialize = function(fromStorage) {

    this._inStorage = fromStorage;

    this._table = this.schema.table;
    this._fieldArray = this.schema.columns.slice();

    var fieldLookup = {};

    this._fieldArray.forEach(function(v) {
      fieldLookup[v.name] = v;
    });

    this._fieldLookup = fieldLookup;

    var data = {};
    var changed = {};

    this.fieldList().forEach(function(v) {
      data[v] = null;
      changed[v] = false;
    });

    this._data = data;
    this._changed = changed;
    this._errors = {};

    this._validations = this._validations || {};

    this._validate();

    return true;

  };

  Model.prototype.hasChanged = function(field) {
    return field === undefined ? this.changedFields().length > 0 : !!this._changed[field];
  };

  Model.prototype.changedFields = function() {
    var changed = this._changed;
    return Object.keys(changed).filter(function(v) {
      return changed[v];
    });
  };

  Model.prototype.errorObject = function() {
    return this.hasErrors() ? this.getErrors() : null;
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

  Model.prototype._validate = function(fieldList) {

    var data = this._data;

    this.clearError('*');

    return (fieldList || this.fieldList()).filter((function(field) {

      this.clearError(field);
      var value = data[field];

      return (this._validations[field] || []).filter((function(validation) {

        var isValid = validation.action.call(null, value);
        return !(isValid || !this.setError(field, validation.message));

      }).bind(this)).length > 0;

    }).bind(this)).concat((this._validations['*'] || []).filter((function(validation) {

      var isValid = validation.action.call(null, data);
      return !(isValid || !this.setError('*', validation.message));

    }).bind(this))).length > 0;

  };

  Model.prototype.load = function(data, fromStorage) {

    var self = this;

    !fromStorage && self.set('created_at', new Date());

    self.fieldList().filter(function(key) {
      return data.hasOwnProperty(key);
    }).forEach(function(key) {
      // do not validate or log changes when loading from storage
      self.set(key, data[key], !fromStorage, !fromStorage);
    });

    return this;

  };

  Model.prototype.set = function(field, value, validate, logChange) {

    validate = (validate === undefined) ? true : !!validate;
    logChange = (logChange === undefined) ? true : !!logChange;

    if (!this.hasField(field)) {

      throw new Error('Field ' + field + ' does not belong to model ' + this.constructor.name);

    }

    var dataType = this.getDataTypeOf(field);
    var newValue = null;

    value = (value !== undefined) ? value : null;

    if (value !== null) {
      if (this.isFieldArray(field)) {
        newValue = value instanceof Array ? value : [value];
        newValue = newValue.map(function(v) { return dataType.convert(v); });
      } else {
        newValue = dataType.convert(value);
      }
    }

    var curValue = this._data[field];
    var changed = false;

    if (newValue !== curValue) {
      if (newValue instanceof Array && curValue instanceof Array) {
        if (newValue.filter(function(v, i) { return v !== curValue[i]; }).length) {
          this._data[field] = newValue;
          logChange && (changed = true);
        }
      } else {
        this._data[field] = newValue;
        logChange && (changed = true);
      }
    }

    this._changed[field] = changed;
    validate && (!logChange || changed) && this._validate([field]);

    return value;

  };

  Model.prototype.get = function(key) {
    return this._data[key];
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

  Model.prototype.setError = function(key, message) {
    this._errors[key] = this._errors[key] || [];
    this._errors[key].push(message);
    return true;
  };

  Model.prototype.clearError = function(key) {
    delete this._errors[key];
    return true;
  };

  Model.prototype.schema = {
    table: '',
    columns: []
  };

  Model.prototype.data = null;

  return Model;

})();

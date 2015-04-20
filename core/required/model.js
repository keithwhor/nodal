module.exports = function(app) {

  function Model(modelData) {

    this.setSchema();

    modelData && this.load(modelData);

  };

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
    })
    return obj;
  };

  Model.prototype.validate = function(fieldList) {

    var errors = this._errors;

    if (!fieldList) {
      errors = {};
      fieldList = this.fieldList();
    }

    fieldList.forEach((function(field) {

      var type;

      if (this.get(field) === null) {
        type = this.getFieldType(field);
        if (!type.primary_key && !type.nullable) {
          !errors[field] && (errors[field] = []);
          errors[field].push('Field can not be null');
          return;
        }
      }

      delete errors[field];

    }).bind(this));

    this._errors = errors;

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

    var type = this.getFieldType(field);

    (value === undefined) && (value = null);

    if (value === null) {
      this._data[field] = null;
    } else {
      if (value instanceof Array && this.getFieldProperties(field).array) {
        this._data[field] = value.map(function(v) { return type.convert(v); });
      } else {
        this._data[field] = type.convert(value);
      }
    }

    this.validate([field]);

    return value;

  };

  Model.prototype.get = function(key) {
    var value = this._data[key];
    return value === undefined ? null : value;
  };

  Model.prototype.getSanitized = function(field) {

    var type = this.getFieldType(field);
    var value = this.get(field);

    if (value instanceof Array) {
      return app.db.adapter.generateArray(value.map(function(v) { return type.sanitize(v); }));
    }

    return type.sanitize(value);

  };

  Model.prototype.toObject = function() {
    var obj = {};
    var data = this._data;
    Object.keys(data).forEach(function(key) {
      obj[key] = data[key];
    })
    return obj;
  };

  Model.prototype.tableName = function() {
    return this._table;
  };

  Model.prototype.hasField = function(field) {
    return !!this._fieldLookup[field];
  };

  Model.prototype.getFieldType = function(field) {
    return app.db.adapter.getType(this._fieldLookup[field].type);
  };

  Model.prototype.getFieldProperties = function(field) {
    return app.db.adapter.parseProperties(this._fieldLookup[field].properties);
  };

  Model.prototype.fieldList = function() {
    return this._fieldArray.map(function(v) { return v.name; });
  };

  Model.prototype.fieldDefinitions = function() {
    return this._fieldArray.slice();
  };

  Model.prototype.save = function(callback) {

    var model = this;

    if(typeof callback !== 'function') {
      callback = function() {};
    }

    if (this.hasErrors()) {
      setTimeout(callback.bind(model, model.getErrors(), model), 1);
      return;
    };

    var columns = this.fieldList().filter(function(v) {
      return !model.getFieldType(v).primary_key;
    });

    var rowData = columns.map(function(v) { return model.getSanitized(v); });

    var query = [
      'INSERT INTO "',
        this.tableName(),
      '"(',
        columns.map(function(v) { return '"' + v + '"'; }).join(','),
      ') VALUES(',
        columns.map(function(v, i) { return '$' + (i + 1); }).join(','),
      ') RETURNING *'
    ].join('');

    app.db.query(query, rowData, function(err, result) {

      if (err) {
        model._errors['_query'] = err.message;
      } else {
        result.rows.length && model.load(result.rows[0]);
      };

      callback.call(model, model.hasErrors() ? model.getErrors() : null, model);

    });

  };

  Model.prototype.schema = {
    table: '',
    fields: []
  };

  Model.prototype.data = null;

  return Model;

};

module.exports = (function() {

  'use strict';

  const DataTypes = require('./data_types.js');
  const Database = require('./db/database.js');
  const ComposerRequest = require('./composer/request.js');

  const utilities = require('./utilities.js');
  const async = require('async');

  class Model {

    constructor(modelData, fromStorage) {

      modelData = modelData || {};

      this._validations = {};
      this._relationshipCache = {};

      this.__preInitialize__();
      this.__initialize__();
      this.__load__(modelData, fromStorage);
      this.__postInitialize__();

    }

    __preInitialize__() {
      return true;
    }

    __postInitialize__() {
      return true;
    }

    __initialize__() {

      this._inStorage = false;

      this._table = this.schema.table;
      this._fieldArray = this.schema.columns.slice();

      let fieldLookup = {};

      this._fieldArray.forEach(function(v) {
        fieldLookup[v.name] = v;
      });

      this._fieldLookup = fieldLookup;

      let data = {};
      let changed = {};

      this.fieldList().forEach(function(v) {
        data[v] = null;
        changed[v] = false;
      });

      this._data = data;
      this._changed = changed;
      this._errors = {};

      this.__validate__();

      return true;

    }

    inStorage() {
      return this._inStorage;
    }

    validates(field, message, fnAction) {

      this._validations[field] = this._validations[field] || [];
      this._validations[field].push({message: message, action: fnAction});

    }

    hasChanged(field) {
      return field === undefined ? this.changedFields().length > 0 : !!this._changed[field];
    }

    changedFields() {
      let changed = this._changed;
      return Object.keys(changed).filter(function(v) {
        return changed[v];
      });
    }

    errorObject() {
      return this.hasErrors() ? this.getErrors() : null;
    }

    hasErrors() {

      return Object.keys(this._errors).length > 0;

    }

    getErrors() {
      let obj = {};
      let errors = this._errors;
      Object.keys(errors).forEach(function(key) {
        obj[key] = errors[key];
      });
      return obj;
    }

    __validate__(fieldList) {

      let data = this._data;

      this.clearError('*');

      return (fieldList || this.fieldList()).filter((function(field) {

        this.clearError(field);
        let value = data[field];

        return (this._validations[field] || []).filter((function(validation) {

          let isValid = validation.action.call(null, value);
          return !(isValid || !this.setError(field, validation.message));

        }).bind(this)).length > 0;

      }).bind(this)).concat((this._validations['*'] || []).filter((function(validation) {

        let isValid = validation.action.call(null, data);
        return !(isValid || !this.setError('*', validation.message));

      }).bind(this))).length > 0;

    }

    __load__(data, fromStorage) {

      this._inStorage = !!fromStorage;
      fromStorage && (this._errors = {}); // clear errors if in storage

      if (!fromStorage) {
        this.set('created_at', new Date());
      }

      this.fieldList()
        .concat(Object.keys(this.relationships))
        .filter((key) => data.hasOwnProperty(key))
        .forEach((key) => {
        // do not validate or log changes when loading from storage
          this.set(key, data[key], !fromStorage, !fromStorage);
        });

      return this;

    }

    read(data) {

      this.fieldList()
        .concat(Object.keys(this.relationships))
        .filter((key) => data.hasOwnProperty(key))
        .forEach((key) => this.set(key, data[key]));

      return this;

    }

    set(field, value, validate, logChange) {

      if (this.relationships[field]) {
        let rel = this.relationships[field];
        if (!(value instanceof rel.model)) {
          throw new Error(`${value} is not an instance of ${rel.model.name}`);
        }
        this._relationshipCache[field] = value;
        return this.set(rel.via, value.get('id'));
      }

      validate = (validate === undefined) ? true : !!validate;
      logChange = (logChange === undefined) ? true : !!logChange;

      if (!this.hasField(field)) {

        throw new Error('Field ' + field + ' does not belong to model ' + this.constructor.name);

      }

      let dataType = this.getDataTypeOf(field);
      let newValue = null;

      value = (value !== undefined) ? value : null;

      if (value !== null) {
        if (this.isFieldArray(field)) {
          newValue = value instanceof Array ? value : [value];
          newValue = newValue.map(function(v) { return dataType.convert(v); });
        } else {
          newValue = dataType.convert(value);
        }
      }

      let curValue = this._data[field];
      let changed = false;

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
      validate && (!logChange || changed) && this.__validate__([field]);

      return value;

    }

    get(key, ignoreFormat) {
      let datum = this._data[key];
      return (!ignoreFormat && this.formatters[key]) ? this.formatters[key](datum) : datum;
    }

    relationship(db, callback) {

      let relationships = utilities.getFunctionParameters(callback);
      relationships = relationships.slice(1);

      if (!relationships.length) {
        throw new Error('No valid relationships (1st parameter is error)');
      }

      let invalidRelationships = relationships.filter(r => !this.relationships[r]);

      if (invalidRelationships.length) {
        throw new Error(`Relationships "${invalidRelationships.join('", "')}" for model "${this.constructor.name}" do not exist.`);
      }

      let fns = relationships.map(r => this.relationships[r]).map(r => {
        return (callback) => {
          new ComposerRequest(db, r.model).find(this.get(r.via), (err, model) => {
            callback(err, model);
          });
        }
      });

      async.parallel(fns, (err, results) => {
        return callback.apply(this, [err].concat(results));
      });

    };

    toObject() {
      let obj = {};
      Object.keys(data).forEach((key) => {
        obj[key] = this.get(key);
      });
      return obj;
    }

    toExternalObject(relationships) {

      relationships = (typeof relationships === 'object') ? relationships : null;

      let obj = {};

      this.externalInterface.forEach((key) => {
        obj[key] = this.get(key);
      });

      if (relationships) {

        Object.keys(this._relationshipCache)
          .filter(key => relationships[key])
          .forEach(key => obj[key] = this._relationshipCache[key].toExternalObject(relationships[key]));

      }

      return obj;

    }

    tableName() {
      return this._table;
    }

    hasField(field) {
      return !!this._fieldLookup[field];
    }

    getFieldData(field) {
      return this._fieldLookup[field];
    }

    getDataTypeOf(field) {
      return DataTypes[this._fieldLookup[field].type];
    }

    isFieldArray(field) {
      let fieldData = this._fieldLookup[field];
      return !!(fieldData && fieldData.properties && fieldData.properties.array);
    }

    isFieldPrimaryKey(field) {
      let fieldData = this._fieldLookup[field];
      return !!(fieldData && fieldData.properties && fieldData.properties.primary_key);
    }

    fieldDefaultValue(field) {
      let fieldData = this._fieldLookup[field];
      return !!(fieldData && fieldData.properties && fieldData.properties.array);
    }

    fieldList() {
      return this._fieldArray.map(function(v) { return v.name; });
    }

    fieldDefinitions() {
      return this._fieldArray.slice();
    }

    setError(key, message) {
      this._errors[key] = this._errors[key] || [];
      this._errors[key].push(message);
      return true;
    }

    clearError(key) {
      delete this._errors[key];
      return true;
    }

    save(db, callback) {

      if (this.readOnly) {
        throw new Error(this.constructor.name + ' is marked as readOnly, can not save');
      }

      let model = this;

      if (!(db instanceof Database)) {
        throw new Error('Must provide a valid Database to save to');
      }

      if(typeof callback !== 'function') {
        callback() = function() {};
      }

      if (model.hasErrors()) {
        setTimeout(callback.bind(model, model.getErrors(), model), 1);
        return;
      }

      let columns, query;

      if (!model.inStorage()) {

        columns = model.fieldList().filter(function(v) {
          return !model.isFieldPrimaryKey(v) && model.get(v, true) !== null;
        });

        query = db.adapter.generateInsertQuery(model.schema.table, columns);

      } else {

        columns = ['id'].concat(model.changedFields().filter(function(v) {
          return !model.isFieldPrimaryKey(v);
        }));

        query = db.adapter.generateUpdateQuery(model.schema.table, columns);

      }

      db.query(
        query,
        columns.map(function(v) {
          return db.adapter.sanitize(model.getFieldData(v).type, model.get(v, true));
        }),
        function(err, result) {

          if (err) {
            model.setError('_query', err.message);
          } else {
            result.rows.length && model.__load__(result.rows[0], true);
          }

          callback.call(model, model.errorObject(), model);

        }
      );

    }

    destroy(db, callback) {

      if (this.readOnly) {
        throw new Error(this.constructor.name + ' is marked as readOnly, can not destroy');
      }

      let model = this;

      if (!(db instanceof Database)) {
        throw new Error('Must provide a valid Database to save to');
      }

      if(typeof callback !== 'function') {
        callback() = function() {};
      }

      if (!model.inStorage()) {

        setTimeout(callback.bind(model, {'_query': 'Model has not been saved'}, model), 1);
        return;

      }

      let columns = model.fieldList().filter(function(v) {
        return model.isFieldPrimaryKey(v);
      });

      let query = db.adapter.generateDeleteQuery(model.schema.table, columns);

      db.query(
        query,
        columns.map(function(v) {
          return db.adapter.sanitize(model.getFieldData(v).type, model.get(v, true));
        }),
        function(err, result) {

          if (err) {
            model.setError('_query', err.message);
          } else {
            model._inStorage = false;
          }

          callback.call(model, model.errorObject(), model);

        }
      );

    }

  }

  Model.prototype.schema = {
    table: '',
    columns: []
  };

  Model.prototype.relationships = {};
  Model.prototype.formatters = {};

  Model.prototype.readOnly = false;

  Model.prototype.data = null;

  Model.prototype.externalInterface = [
    'id',
    'created_at'
  ];

  Model.prototype.aggregateBy = {
    'id': 'count',
    'created_at': 'min'
  };

  Model.find = function(db, callback) {

    return new ComposerRequest(db, r.model).find(id, (err, model) => {
      callback.call(this, err, model);
    });

  };

  Model.query = function(db) {

    return new ComposerRequest(db, this).begin();

  };

  Model.toResource = function(resourceColumns) {

    if (!resourceColumns || !resourceColumns.length) {
      resourceColumns = this.prototype.schema.columns.map(v => v.name);
    }

    let columns = this.prototype.schema.columns;
    let lookup = [];
    columns.forEach(v => lookup[v.name] = v);

    let fields = resourceColumns.map(v => {
      // if it's a transformation
      if (v.alias) {
        return {
          name: v.alias,
          type: v.type !== undefined ? v.type : (lookup[v.columns[0]] ? lookup[v.columns[0]].type : 'string'),
          array: v.array !== undefined ? v.array : (lookup[v.columns[0]] ? !!(lookup[v.columns[0]].properties && lookup[v.columns[0]].properties.array) : false),
          transform: true
        };
      }
      // otherwise...
      return {
        name: v,
        type: lookup[v] ? lookup[v].type : 'string',
        array: lookup[v] ? !!(lookup[v].properties && lookup[v].properties.array) : false
      };
    });

    return {
      name: this.name,
      fields: fields
    };

  }

  return Model;

})();

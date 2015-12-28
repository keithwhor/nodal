module.exports = (function() {

  'use strict';

  const DataTypes = require('./db/data_types.js');
  const Database = require('./db/database.js');
  const Composer = require('./composer/composer.js');

  const utilities = require('./utilities.js');
  const async = require('async');

  /**
  * Basic Model implementation. Optionally interfaces with database.
  * @class
  */
  class Model {

    /**
    * Finds a model with a provided id, otherwise returns a notFound error.
    * @param {number} id The id of the model you're looking for
    * @param {function({Error} err, {Nodal.Model} model)} callback The callback to execute upon completion
    */
    static find(id, callback) {

      let db = this.prototype.db;

      // legacy support
      if (arguments.length === 3) {
        db = arguments[0];
        id = arguments[1];
        callback = arguments[2];
      }

      return new Composer(db, this)
        .filter({id: id})
        .end((err, models) => {

          if (!err && !models.length) {
            let err = new Error(`Could not find ${this.name} with id "${id}".`);
            err.notFound = true;
            return callback(err);
          }

          callback(err, models[0]);

        });

    }

    /**
    * Creates a new model instance using the provided data.
    * @param {object} data The data to load into the object.
    * @param {function({Error} err, {Nodal.Model} model)} callback The callback to execute upon completion
    */
    static create(data, callback) {

      let model = new this(data);
      model.save(callback);

    }

    /**
    * Finds and updates a model with a specified id. Return a notFound error if model does not exist.
    * @param {number} id The id of the model you're looking for
    * @param {object} data The data to load into the object.
    * @param {function({Error} err, {Nodal.Model} model)} callback The callback to execute upon completion
    */
    static update(id, data, callback) {

      this.find(id, (err, model) => {

        if (err) {
          callback(err);
        }

        model.read(data);
        model.save(callback);

      });

    }

    /**
    * Finds and destroys a model with a specified id. Return a notFound error if model does not exist.
    * @param {number} id The id of the model you're looking for
    * @param {function({Error} err, {Nodal.Model} model)} callback The callback to execute upon completion
    */
    static destroy(id, callback) {

      this.find(id, (err, model) => {

        if (err) {
          callback(err);
        }

        model.destroy(callback);

      });

    }

    /**
    * Creates a new Composer (ORM) instance to begin a new query.
    * @param {optional Nodal.Database} db Deprecated - provide a database to query from. Set the model's db in its constructor file, instead.
    * @return {Nodal.Composer}
    */
    static query(db) {

      db = db || this.prototype.db;
      return new Composer(db, this);

    }

    /**
    * Get the model's column names
    * @return {Array}
    */
    static columns() {
      return this.prototype.schema.columns.map(v => v.name);
    }

    /**
    * Get the model's relationship with a provided name
    * @param {string} name Relationship name
    * @return {Object}
    */
    static relationship(name) {
      return this.prototype._relationships[name];
    }

    /**
    * Get resource data for a model, for API responses and debug information
    * @param {Array} arrInterface Array of strings representing output columns, or singularly-keyed objects representing relationships and their interface.
    * @return {Object} Resource object for the model
    */
    static toResource(arrInterface) {

      if (!arrInterface || !arrInterface.length) {
        arrInterface = this.columns().concat(
          Object.keys(this.prototype._relationships)
            .map(r => {
              let obj = {};
              obj[r] = this.relationship(r).model.columns();
              return obj;
            })
        );
      }


      let columns = this.prototype.schema.columns;
      let columnLookup = {};
      columns.forEach(v => columnLookup[v.name] = v);

      let resourceColumns = arrInterface.map(r => {

        if (typeof r === 'string') {

          let field = columnLookup[r];

          if (!field) {
            return null;
          }

          let fieldData = {
            name: r,
            type: field ? field.type : 'string'
          };

          field.array && (fieldData.array = true);

          return fieldData;

        } else if (typeof r === 'object' && r !== null) {

          let key = Object.keys(r)[0];
          let relationship = this.relationship(key);

          if (!relationship) {
            return null;
          }

          return relationship.model.toResource(r[key]);

        }

      }).filter(r => r);

      return {
        name: this.name,
        type: 'resource',
        fields: resourceColumns
      };

    }

    /**
    * Set the database to be used for this model
    * @param {Nodal.Database} db
    */
    static setDatabase(db) {

      this.prototype.db = db;

    }

    /**
    * Set the schema to be used for this model
    * @param {Object} schema
    */
    static setSchema(schema) {

      this.prototype.schema = schema;

    }

    /**
    * Sets a belongsTo relationship for the Model
    * @param {class Nodal.Model} modelConstructor The Model which your current model belongs to
    * @param {string} name The name you wish yo use for the model (i.e. "user")
    * @param {optional string} viaField Which field in current model represents this relationship, defaults to `${name}_id`
    */
    static belongsTo(modelConstructor, name, viaField) {

      if (!this.prototype.hasOwnProperty('_relationships')) {
        this.prototype._relationships = {};
      };

      viaField = viaField || `${name}_id`;

      this.prototype._relationships[name] = {
        model: modelConstructor,
        via: viaField
      };

    }

    /**
    * Create a validator
    * @param {string} field The field you'd like to validate
    * @param {string} message The error message shown if a validation fails.
    * @param {function({any} value)} fnAction the validation to run - first parameter is the value you're testing.
    */
    static validates(field, message, fnAction) {

      if (!this.prototype.hasOwnProperty('_validations')) {
        this.prototype._validations = {};
      };

      this.prototype._validations[field] = this.prototype._validations[field] || [];
      this.prototype._validations[field].push({message: message, action: fnAction});

    }

    /**
    * @param {Object} modelData Data to load into the object
    * @param {optional boolean} fromStorage Is this model being loaded from storage? Defaults to false.
    */
    constructor(modelData, fromStorage) {

      modelData = modelData || {};

      this._relationshipCache = {};

      this.__preInitialize__();
      this.__initialize__();
      this.__load__(modelData, fromStorage);
      this.__postInitialize__();

    }

    /**
    * Expected to be overwritten when inherited. Anything done before loading data, like validations, goes here.
    * @deprecated
    */
    __preInitialize__() {
      return true;
    }

    /**
    * Expected to be overwritten when inherited. Anything done after loading data (computed fields, etc.) goes here.
    * @deprecated
    */
    __postInitialize__() {
      return true;
    }

    /**
    * Prepare model for use
    */
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

    /**
    * Indicates whethere or not the model is currently represented in hard storage (db).
    * @return {boolean}
    */
    inStorage() {
      return this._inStorage;
    }

    /**
    * Tells us whether a model field has changed since we created it or loaded it from storage.
    * @param {string} field The model field
    * @return {boolean}
    */
    hasChanged(field) {
      return field === undefined ? this.changedFields().length > 0 : !!this._changed[field];
    }

    /**
    * Provides an array of all changed fields since model was created / loaded from storage
    * @return {Array}
    */
    changedFields() {
      let changed = this._changed;
      return Object.keys(changed).filter(function(v) {
        return changed[v];
      });
    }

    /**
    * Creates an error object for the model if any validations have failed, returns null otherwise
    * @return {Error}
    */
    errorObject() {

      let error = null;

      if (this.hasErrors()) {

        let errorObject = this.getErrors();
        let message = errorObject._query || 'There was an error with your request';

        error = new Error(message);
        error.details = errorObject;

      }

      return error;

    }

    /**
    * Tells us whether or not the model has errors (failed validations)
    * @return {boolean}
    */
    hasErrors() {

      return Object.keys(this._errors).length > 0;

    }

    /**
    * Gives us an error object with each errored field as a key, and each value
    * being an array of failure messages from the validators
    * @return {Object}
    */
    getErrors() {
      let obj = {};
      let errors = this._errors;
      Object.keys(errors).forEach(function(key) {
        obj[key] = errors[key];
      });
      return obj;
    }

    /**
    * Validates provided fieldList (or all fields if not provided)
    * @param {optional Array} fieldList fields to validate
    */
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

    /**
    * Loads data into the model
    * @param {Object} data Data to load into the model
    * @param {optional boolean} fromStorage Specify if the model was loaded from storage. Defaults to false.
    */
    __load__(data, fromStorage) {

      this._inStorage = !!fromStorage;
      fromStorage && (this._errors = {}); // clear errors if in storage

      if (!fromStorage) {
        this.set('created_at', new Date());
      }

      this.fieldList()
        .concat(Object.keys(this._relationships))
        .filter((key) => data.hasOwnProperty(key))
        .forEach((key) => {
        // do not validate or log changes when loading from storage
          this.set(key, data[key], !fromStorage, !fromStorage);
        });

      return this;

    }

    /**
    * Reads new data into the model.
    * @param {Object} data Data to inject into the model
    * @return {this}
    */
    read(data) {

      this.fieldList()
        .concat(Object.keys(this._relationships))
        .filter((key) => data.hasOwnProperty(key))
        .forEach((key) => this.set(key, data[key]));

      return this;

    }

    /**
    * Sets specified field data for the model
    * @param {string} field Field to set
    * @param {any} value Value for the field
    * @param {optional boolean} validate Specify if you would like to validate the change (defaults to true)
    * @param {optional boolean} logChange Specify if you'd like to count this as a changed field (defaults to true)
    */
    set(field, value, validate, logChange) {

      if (this._relationships[field]) {
        let rel = this._relationships[field];
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

    /**
    * Retrieve field data for the model.
    * @param {string} field Field for which you'd like to retrieve data.
    */
    get(field, ignoreFormat) {
      let datum = this._data[field];
      return (!ignoreFormat && this.formatters[field]) ? this.formatters[field](datum) : datum;
    }

    /**
    * Retrieve associated models related to this model from the database.
    * @param {function({Error} err, {Nodal.Model|Nodal.ModelArray} model_1, ... {Nodal.Model|Nodal.ModelArray} model_n)}
    *   Pass in a function with named parameters corresponding the relationships you'd like to retrieve.
    *   The first parameter is always an error callback.
    */
    relationship(callback) {

      let db = this.db;

      // legacy support
      if (arguments.length === 2) {
        db = arguments[0];
        callback = arguments[1];
      }

      let relationships = utilities.getFunctionParameters(callback);
      relationships = relationships.slice(1);

      if (!relationships.length) {
        throw new Error('No valid relationships (1st parameter is error)');
      }

      let invalidRelationships = relationships.filter(r => !this._relationships[r]);

      if (invalidRelationships.length) {
        throw new Error(`Relationships "${invalidRelationships.join('", "')}" for model "${this.constructor.name}" do not exist.`);
      }

      let fns = relationships.map(r => this._relationships[r]).map(r => {
        return (callback) => {
          r.model.find(db, this.get(r.via), (err, model) => {
            callback(err, model);
          });
        }
      });

      async.parallel(fns, (err, results) => {

        relationships.forEach((r, i) => {
          this.set(r, results[i]);
        });

        return callback.apply(this, [err].concat(results));

      });

    };

    /**
    * Creates a plain object from the Model, with properties matching an optional interface
    * @param {optional Array} arrInterface Interface to use for object creation
    */
    toObject(arrInterface) {

      let obj = {};

      if (arrInterface) {

        arrInterface.forEach(key => {

          if (typeof key === 'object' && key !== null) {
            let relationship = Object.keys(key)[0];
            if (this._relationshipCache[relationship]) {
              obj[key] = this._relationshipCache[relationship].toObject(key[relationship]);
            }
          } else if (this._data[key]) {
            obj[key] = this.get(key);
          }

        });

      } else {

        Object.keys(this._data).forEach(key => obj[key] = this.get(key));
        Object.keys(this._relationships).forEach(key => {
          obj[key] = this._relationshipCache[key] ? this._relationshipCache[key].toObject() : null;
        });

      }

      return obj;

    }

    /**
    * Get the table name for the model.
    * @return {string}
    */
    tableName() {
      return this._table;
    }

    /**
    * Determine if the model has a specified field.
    * @param {string} field
    * @return {boolean}
    */
    hasField(field) {
      return !!this._fieldLookup[field];
    }

    /**
    * Retrieve the schema field data for the specified field
    * @param {string} field
    * @return {Object}
    */
    getFieldData(field) {
      return this._fieldLookup[field];
    }

    /**
    * Retrieve the schema data type for the specified field
    * @param {string} field
    * @return {string}
    */
    getDataTypeOf(field) {
      return DataTypes[this._fieldLookup[field].type];
    }

    /**
    * Determine whether or not this field is an Array (PostgreSQL supports this)
    * @param {string} field
    * @return {boolean}
    */
    isFieldArray(field) {
      let fieldData = this._fieldLookup[field];
      return !!(fieldData && fieldData.properties && fieldData.properties.array);
    }

    /**
    * Determine whether or not this field is a primary key in our schema
    * @param {string} field
    * @return {boolean}
    */
    isFieldPrimaryKey(field) {
      let fieldData = this._fieldLookup[field];
      return !!(fieldData && fieldData.properties && fieldData.properties.primary_key);
    }

    /**
    * Retrieve the defaultValue for this field from our schema
    * @param {string} field
    * @return {any}
    */
    fieldDefaultValue(field) {
      let fieldData = this._fieldLookup[field];
      return !!(fieldData && fieldData.properties && fieldData.properties.array);
    }

    /**
    * Retrieve an array of fields for our model
    * @return {Array}
    */
    fieldList() {
      return this._fieldArray.map(function(v) { return v.name; });
    }

    /**
    * Retrieve our field schema definitions
    * @return {Array}
    */
    fieldDefinitions() {
      return this._fieldArray.slice();
    }

    /**
    * Set an error for a specified field (supports multiple errors)
    * @param {string} key The specified field for which to create the error (or '*' for generic)
    * @param {string} message The error message
    * @return {boolean}
    */
    setError(key, message) {
      this._errors[key] = this._errors[key] || [];
      this._errors[key].push(message);
      return true;
    }

    /**
    * Clears all errors for a specified field
    * @param {string} key The specified field for which to create the error (or '*' for generic)
    * @return {boolean}
    */
    clearError(key) {
      delete this._errors[key];
      return true;
    }

    /**
    * Saves model to database
    * @param {function({Error} err, {Nodal.Model} model)} callback
    *   Method to execute upon completion, returns error if failed (including validations didn't pass)
    */
    save(callback) {

      let db = this.db;

      // Legacy
      if (arguments.length === 2) {
        db = arguments[0];
        callback = arguments[1];
      }

      if (this.readOnly) {
        throw new Error(this.constructor.name + ' is marked as readOnly, can not save');
      }

      let model = this;

      if (!(db instanceof Database)) {
        throw new Error('Must provide a valid Database to save to');
      }

      if(typeof callback !== 'function') {
        callback = function() {};
      }

      if (model.hasErrors()) {
        callback.call(model, {message: 'Validation error', fields: model.getErrors()}, model);
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

    /**
    * Destroys model reference in database.
    * @param {function({Error} err, {Nodal.Model} model)} callback
    *   Method to execute upon completion, returns error if failed
    */
    destroy(callback) {

      let db = this.db;

      // Legacy
      if (arguments.length === 2) {
        db = arguments[0];
        callback = arguments[1];
      }

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

  Model.prototype._relationships = {};
  Model.prototype._validations = {};
  Model.prototype.formatters = {};

  Model.prototype.readOnly = false;

  Model.prototype.data = null;

  Model.prototype.db = null;

  Model.prototype.externalInterface = [
    'id',
    'created_at'
  ];

  Model.prototype.aggregateBy = {
    'id': 'count',
    'created_at': 'min'
  };

  return Model;

})();

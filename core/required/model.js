module.exports = (function() {

  'use strict';

  const DataTypes = require('./db/data_types.js');
  const Database = require('./db/database.js');
  const Composer = require('./composer.js');

  const ModelArray = require('./model_array.js');

  const utilities = require('./utilities.js');
  const async = require('async');
  const inflect = require('i')();

  /**
  * Basic Model implementation. Optionally interfaces with database.
  * @class
  */
  class Model {

    /**
    * @param {Object} modelData Data to load into the object
    * @param {optional boolean} fromStorage Is this model being loaded from storage? Defaults to false.
    */
    constructor(modelData, fromStorage) {

      modelData = modelData || {};

      this.__initialize__();
      this.__load__(modelData, fromStorage);

    }

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

      return new Composer(this)
        .where({id: id})
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
          return callback(err);
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
          return callback(err);
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
      return new Composer(this);

    }

    /**
    * Get the model's table name
    * @return {string}
    */
    static table() {
      return this.prototype.schema.table;
    };

    /**
    * Get the model's column data
    * @return {Array}
    */
    static columns() {
      return this.prototype.schema.columns;
    };

    /**
    * Get the model's column names (fields)
    * @return {Array}
    */
    static columnNames() {
      return this.columns().map(v => v.name);
    }

    /**
    * Get the model's column lookup data
    * @return {Object}
    */
    static columnLookup() {
      return this.columns().reduce((p, c) => {
        p[c.name] = c;
        return p;
      }, {});
    }

    /**
    * Check if the model has a column name in its schema
    * @param {string} columnName
    */
    static hasColumn(columnName) {
      return !!this.column(columnName);
    }

    /**
    * Return the column schema data for a given name
    * @param {string} columnName
    */
    static column(columnName) {
      return this.prototype._columnLookup[columnName];
    }

    /**
    * Check if the model has a relationship with a given name
    * @param {string} name
    */
    static hasJoin(name) {
      return !!this.joinInformation(name);
    }

    /**
    * Retrieve join information based on the provided name
    * @param {string} name Relationship name
    * @return {Object}
    */
    static joinInformation(name) {
      return this.prototype._joins[name];
    }

    /**
    * Get resource data for a model, for API responses and debug information
    * @param {Array} arrInterface Array of strings representing output columns, or singularly-keyed objects representing relationships and their interface.
    * @return {Object} Resource object for the model
    */
    static toResource(arrInterface) {

      if (!arrInterface || !arrInterface.length) {
        arrInterface = this.columnNames().concat(
          Object.keys(this.prototype._joins)
            .map(r => {
              let obj = {};
              obj[r] = this.joinInformation(r).Model.columnNames();
              return obj;
            })
        );
      }


      let columnLookup = this.columnLookup();

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

          if (field.array) {(fieldData.array = true) }

          return fieldData;

        } else if (typeof r === 'object' && r !== null) {

          return null; // FIXME: Deprecated for relationships.

          let key = Object.keys(r)[0];
          let relationship = this.joinInformation(key);

          if (!relationship) {
            return null;
          }

          return relationship.Model.toResource(r[key]);

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

      this.prototype._table = this.table();
      this.prototype._columns = this.columns();
      this.prototype._columnNames = this.columnNames();
      this.prototype._columnLookup = this.columnLookup();

      this.prototype._data = this.columnNames()
        .reduce((p, c) => {
          p[c] = null;
          return p;
        }, {});

      this.prototype._changed = this.columnNames()
        .reduce((p, c) => {
          p[c] = false;
          return p;
        }, {});

    }

    /**
    * Sets a joins relationship for the Model. Sets joinedBy relationship for parent.
    * @param {class Nodal.Model} modelConstructor The Model which your current model belongs to
    * @param {optional Object} options
    *   "name": The string name of the parent in the relationship (default to camelCase of Model name)
    *   "via": Which field in current model represents this relationship, defaults to `${name}_id`
    *   "as": What to display the name of the child as when joined to the parent (default to camelCase of child name)
    */
    static joinsTo(modelConstructor, options) {

      if (!this.prototype.hasOwnProperty('_joins')) {
        this.prototype._joins = {};
        this.prototype._joinsList = [];
      };

      options = options || {};

      options.name = options.name || inflect.camelize(modelConstructor.name, false);
      options.via = options.via || `${inflect.underscore(options.name)}_id`;
      options.multiple = !!options.multiple;

      if (!options.as) {

        options.as = inflect.camelize(this.name, false);

        if (options.multiple) {
          options.as = inflect.pluralize(options.as);
        }

      }

      if (this.prototype._joins[options.name]) {
        throw new Error(`Join relationship already exists for "${options.name}" on "${this.name}".`);
      }

      this.prototype._joins[options.name] = {
        Model: modelConstructor,
        child: false,
        via: options.via,
        multiple: options.multiple
      };

      this.prototype._joinsList.push(options.name);

      if (!modelConstructor.prototype.hasOwnProperty('_joins')) {
        modelConstructor.prototype._joins = {};
        modelConstructor.prototype._joinsList = [];
      };

      if (modelConstructor.prototype._joins[options.as]) {
        throw new Error(`Join relationship already exists for "${options.as}" on "${modelConstructor.name}".`);
      }

      modelConstructor.prototype._joins[options.as] = {
        Model: this,
        child: true,
        via: options.via,
        multiple: options.multiple
      };

      modelConstructor.prototype._joinsList.push(options.as);

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
        this.prototype._validationsList = [];
      };

      if (!this.prototype._validations[field]) {
        this.prototype._validationsList.push(field);
      }

      this.prototype._validations[field] = this.prototype._validations[field] || [];
      this.prototype._validations[field].push({message: message, action: fnAction});

    }

    /**
    * Create a calculated field (in JavaScript). Must be synchronous.
    * @param {string} calcField The name of the calculated field
    * @param {function} fnCalculate The synchronous method to perform a calculation for.
    *   Pass the names of the (non-computed) fields you'd like to use as parameters.
    */
    static calculates(calcField, fnCompute) {

      if (!this.prototype.hasOwnProperty('_calculations')) {
        this.prototype._calculations = {};
        this.prototype._calculationsList = [];
      }

      if (this.prototype._calculations[calcField]) {
        throw new Error(`Calculated field "${calcField}" for "${this.name}" already exists!`);
      }

      let columnLookup = this.columnLookup();

      if (columnLookup[calcField]) {
        throw new Error(`Cannot create calculated field "${calcField}" for "${this.name}", field already exists.`);
      }

      let fields = utilities.getFunctionParameters(fnCompute);

      fields.forEach(f => {
        if (!columnLookup[f]) {
          throw new Error(`Calculation function error: "${calcField} for "${this.name}" using field "${f}", "${f}" does not exist.`)
        }
      });

      this.prototype._calculations[calcField] = {
        calculate: fnCompute,
        fields: fields
      };

      this.prototype._calculationsList.push(calcField);

    }

    /**
    * Prepare model for use
    * @private
    */
    __initialize__() {

      this._joinsCache = {};
      this._joinedByCache = {};

      this._data = Object.create(this._data); // Inherit from prototype
      this._changed = Object.create(this._changed); // Inherit from prototype
      this._errors = {};

      return true;

    }

    /**
    * Loads data into the model
    * @private
    * @param {Object} data Data to load into the model
    * @param {optional boolean} fromStorage Specify if the model was loaded from storage. Defaults to false.
    */
    __load__(data, fromStorage) {

      this._inStorage = !!fromStorage;

      if (!fromStorage) {
        data.created_at = new Date();
      }

      let keys = Object.keys(data);

      keys.forEach(key => {
        this.__safeSet__(key, data[key]);
        this._changed[key] = !fromStorage
      });

      this.__validate__();

      return this;

    }

    /**
    * Validates provided fieldList (or all fields if not provided)
    * @private
    * @param {optional Array} fieldList fields to validate
    */
    __validate__(field) {

      let data = this._data;

      if (!field) {

        let valid = true;
        this._validationsList.forEach(field => valid = (this.__validate__(field) && valid));
        return valid;

      } else if (!this._validations[field]) {

        return true;

      }

      this.clearError(field);
      let value = this._data[field];

      return this._validations[field].filter(validation => {
        let valid = validation.action.call(null, value);
        !valid && this.setError(field, validation.message);
        return valid;
      }).length === 0;

    }

    /**
    * Sets specified field data for the model, assuming data is safe and does not log changes
    * @param {string} field Field to set
    * @param {any} value Value for the field
    */
    __safeSet__(field, value) {

      if (this._joins[field]) {

        return this.setJoined(field, value);

      }

      if (!this.hasField(field)) {

        return;

      }

      this._data[field] = this.convert(field, value);

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
      return Object.keys(changed).filter(v => changed[v]);
    }

    /**
    * Creates an error object for the model if any validations have failed, returns null otherwise
    * @return {Error}
    */
    errorObject() {

      let error = null;

      if (this.hasErrors()) {

        let errorObject = this.getErrors();
        let message = errorObject._query || 'Validation error';

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
    * Reads new data into the model.
    * @param {Object} data Data to inject into the model
    * @return {this}
    */
    read(data) {

      this.fieldList()
        .concat(this._joinsList)
        .filter((key) => data.hasOwnProperty(key))
        .forEach((key) => this.set(key, data[key]));

      return this;

    }

    /**
    * Converts a value to its intended format based on its field. Returns null if field not found.
    * @param {string} field The field to use for conversion data
    * @param {any} value The value to convert
    */
    convert(field, value) {

      if (!this.hasField(field) || value === null || value === undefined) {
        return null;
      }

      let dataType = this.getDataTypeOf(field);

      if (this.isFieldArray(field)) {
        return (value instanceof Array ? value : [value]).map(v => dataType.convert(v));
      }

      return dataType.convert(value);

    }

    /**
    * Sets specified field data for the model. Logs and validates the change.
    * @param {string} field Field to set
    * @param {any} value Value for the field
    */
    set(field, value) {

      if (this._joins[field]) {

        return this.setJoined(field, value);

      }

      if (!this.hasField(field)) {

        throw new Error('Field ' + field + ' does not belong to model ' + this.constructor.name);

      }

      let curValue = this._data[field];
      let changed = false;
      value = this.convert(field, value);

      if (value !== curValue) {

        changed = true;

        if (
          value instanceof Array &&
          curValue instanceof Array &&
          value.length === curValue.length
        ) {

          changed = false;
          // If we have two equal length arrays, we must compare every value

          for (let i = 0; i < value.length; i++) {
            if (value[i] !== curValue[i]) {
              changed = true;
              break;
            }
          }

        }
      }

      this._data[field] = value;
      this._changed[field] = changed;
      changed && this.__validate__(field);

      return value;

    }

    /**
    * Set a joined object (Model or ModelArray)
    * @param {string} field The field (name of the join relationship)
    * @param {Model|ModelArray} value The joined model or array of models
    */
    setJoined(field, value) {

      let joinsObject = this._joins[field];

      if (
        (!joinsObject.child || (joinsObject.child && !joinsObject.multiple)) &&
        !(value instanceof joinsObject.Model)
      ) {

        throw new Error(`${value} is not an instance of ${joinsObject.Model.name}`);

      } else if (
        joinsObject.child && joinsObject.multiple &&
        (!(value instanceof ModelArray) || (value._modelConstructor !== joinsObject.Model))
      ) {

        throw new Error(`${value} is not an instanceof ModelArray[${joinsObject.Model.name}]`);

      }

      this._joinsCache[field] = value;

      return this.setJoinedId(field);

    }

    /**
    * Sets appropriate id field for joined models
    * @param {string} field The field (name of the join relationship)
    * @param {Model|ModelArray} value The joined model or array of models
    */
    setJoinedId(field) {

      let joinsObject = this._joins[field];
      let joinedModel = this._joinsCache[field];

      if (!joinedModel) {
        throw new Error('${field} cannot have its joined id set, is not currently added to model.');
      }

      if (joinsObject.child && this.inStorage()) {

        if (joinsObject.multiple) {
          joinedModel.forEach(model => model.set(joinsObject.via, this.get('id')));
        } else {
          joinedModel.set(joinsObject.via, this.get('id'));
        }

      } else if (!joinsObject.child && joinedModel.inStorage()) {

        this.set(joinsObject.via, joinedModel.get('id'));

      }

      return joinedModel;

    }

    /**
    * Calculate field from calculations (assumes it exists)
    *  @param {string} field Name of the calculated field
    */
    calculate(field) {
      let calc = this._calculations[field];
      return calc.calculate.apply(
        this,
        calc.fields.map(f => this.get(f))
      );
    }

    /**
    * Retrieve field data for the model.
    * @param {string} field Field for which you'd like to retrieve data.
    */
    get(field, ignoreFormat) {

      if (this._calculations[field]) {
        return this.calculate(field);
      }

      if (this._joinsCache[field]) {
        return this._joinsCache[field];
      }

      let datum = this._data[field];
      return (!ignoreFormat && this.formatters[field]) ? this.formatters[field](datum) : datum;

    }

    /**
    * Retrieve associated models joined this model from the database.
    * @param {function({Error} err, {Nodal.Model|Nodal.ModelArray} model_1, ... {Nodal.Model|Nodal.ModelArray} model_n)}
    *   Pass in a function with named parameters corresponding the relationships you'd like to retrieve.
    *   The first parameter is always an error callback.
    */
    include(callback) {

      let db = this.db;

      // legacy support
      if (arguments.length === 2) {
        db = arguments[0];
        callback = arguments[1];
      }

      let joinNames = utilities.getFunctionParameters(callback);
      joinNames = joinNames.slice(1);

      if (!joinNames.length) {
        throw new Error('No valid relationships (1st parameter is error)');
      }

      let invalidJoinNames = joinNames.filter(r => !this._joins[r]);

      if (invalidJoinNames.length) {
        throw new Error(`Joins "${invalidJoinNames.join('", "')}" for model "${this.constructor.name}" do not exist.`);
      }

      let fns = joinNames.map(r => this._joins[r]).map(r => {
        return (callback) => {

          if (r.child) {

            let where = {};
            where[r.via] = this.get('id');
            r.Model.query()
              .where(where)
              .end((err, models) => callback(err, r.multiple ? models : models[0]));

          } else {

            r.Model.find(this.get(r.via), callback);

          }

        }
      });

      async.parallel(fns, (err, results) => {

        joinNames.forEach((r, i) => {
          this.set(r, results[i]);
        });

        return callback.apply(this, [err || null].concat(results));

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
            let subInterface = key;
            key = Object.keys(key)[0];
            let joinObject = this._joinsCache[key] || this._joinedByCache[key];
            if (joinObject) {(obj[key] = joinObject.toObject(subInterface[key]));}
          } else if (this._data[key]) {
            obj[key] = this._data[key];
          } else if (this._calculations[key]) {
            obj[key] = this.calculate(key);
          }

        });

      } else {

        this.fieldList().forEach(key => obj[key] = this._data[key]);
        this._calculationsList.forEach(key => obj[key] = this.calculate(key));
        this._joinsList.forEach(key => {
          let cacheValue = this._joinsCache[key] || this._joinedByCache[key];
          if (cacheValue) { (obj[key] = cacheValue.toObject()); }
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
      return !!this._columnLookup[field];
    }

    /**
    * Retrieve the schema field data for the specified field
    * @param {string} field
    * @return {Object}
    */
    getFieldData(field) {
      return this._columnLookup[field];
    }

    /**
    * Retrieve the schema data type for the specified field
    * @param {string} field
    * @return {string}
    */
    getDataTypeOf(field) {
      return DataTypes[this._columnLookup[field].type];
    }

    /**
    * Determine whether or not this field is an Array (PostgreSQL supports this)
    * @param {string} field
    * @return {boolean}
    */
    isFieldArray(field) {
      let fieldData = this._columnLookup[field];
      return !!(fieldData && fieldData.properties && fieldData.properties.array);
    }

    /**
    * Determine whether or not this field is a primary key in our schema
    * @param {string} field
    * @return {boolean}
    */
    isFieldPrimaryKey(field) {
      let fieldData = this._columnLookup[field];
      return !!(fieldData && fieldData.properties && fieldData.properties.primary_key);
    }

    /**
    * Retrieve the defaultValue for this field from our schema
    * @param {string} field
    * @return {any}
    */
    fieldDefaultValue(field) {
      let fieldData = this._columnLookup[field];
      return !!(fieldData && fieldData.properties && fieldData.properties.array);
    }

    /**
    * Retrieve an array of fields for our model
    * @return {Array}
    */
    fieldList() {
      return this._columnNames.slice();
    }

    /**
    * Retrieve our field schema definitions
    * @return {Array}
    */
    fieldDefinitions() {
      return this._columns.slice();
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

    __generateSaveQuery__() {

      let query, columns;
      let db = this.db;

      if (!this.inStorage()) {

        columns = this.fieldList().filter(v => !this.isFieldPrimaryKey(v) && this.get(v, true) !== null);
        query = db.adapter.generateInsertQuery(this.schema.table, columns);

      } else {

        columns = ['id'].concat(this.changedFields().filter(v => !this.isFieldPrimaryKey(v)));
        query = db.adapter.generateUpdateQuery(this.schema.table, columns);

      }

      return {
        sql: query,
        params: columns.map(v => db.adapter.sanitize(this.getFieldData(v).type, this.get(v)))
      };

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

      if(typeof callback !== 'function') {
        callback = function() {};
      }

      if (this.hasErrors()) {
        callback.call(this, this.errorObject(), this);
        return;
      }

      let query = this.__generateSaveQuery__();

      db.query(
        query.sql,
        query.params,
        (err, result) => {

          if (err) {
            this.setError('_query', err.message);
          } else {
            result.rows.length && this.__load__(result.rows[0], true);
          }

          callback.call(this, this.errorObject(), this);

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

      let model = this;

      if (!(db instanceof Database)) {
        throw new Error('Must provide a valid Database to save to');
      }

      if (typeof callback !== 'function') {
        callback = function() {};
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

  Model.prototype._joins = {};
  Model.prototype._joinsList = [];

  Model.prototype._validations = {};
  Model.prototype._validationsList = [];

  Model.prototype._calculations = {};
  Model.prototype._calculationsList = [];

  Model.prototype.formatters = {};

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

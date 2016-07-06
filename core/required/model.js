'use strict';

const DataTypes = require('./db/data_types.js');
const Database = require('./db/database.js');
const Composer = require('./composer.js');

const ModelArray = require('./model_array.js');

const utilities = require('./utilities.js');
const async = require('async');
const inflect = require('i')();
const deepEqual = require('deep-equal');

const RelationshipGraph = require('./relationship_graph.js');
const Relationships = new RelationshipGraph();

/**
* Basic Model implementation. Optionally interfaces with database.
* @class
*/
class Model {

  /**
  * @param {Object} modelData Data to load into the object
  * @param {optional boolean} fromStorage Is this model being loaded from storage? Defaults to false.
  * @param {option boolean} fromSeed Is this model being seeded?
  */
  constructor(modelData, fromStorage, fromSeed) {

    modelData = modelData || {};

    this.__initialize__();
    this.__load__(modelData, fromStorage, fromSeed);

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
  * Finds a model with a provided field, value pair. Returns the first found.
  * @param {string} field Name of the field
  * @param {any} value Value of the named field to compare against
  * @param {function({Error} err, {Nodal.Model} model)} callback The callback to execute upon completion
  */
  static findBy(field, value, callback) {

    let db = this.prototype.db;
    let query = {};
    query[field] = value;

    return new Composer(this)
      .where(query)
      .end((err, models) => {

        if (!err && !models.length) {
          let err = new Error(`Could not find ${this.name} with ${field} "${value}".`);
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
  * Finds a model with a provided field, value pair. Returns the first found.
  * @param {string} field Name of the field
  * @param {object} data Key-value pairs of Model creation data. Will use appropriate value to query for based on "field" parametere.
  * @param {function({Error} err, {Nodal.Model} model)} callback The callback to execute upon completion
  */
  static findOrCreateBy(field, data, callback) {

    this.findBy(field, data[field], (err, model) => {

      if (err) {
        if (err.notFound) {
          return this.create(data, callback);
        } else {
          return callback(err);
        }
      } else {
        return callback(null, model);
      }

    });

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
  }

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
  * Get resource data for a model, for API responses and debug information
  * @param {Array} arrInterface Array of strings representing output columns, or singularly-keyed objects representing relationships and their interface.
  * @return {Object} Resource object for the model
  * @deprecated
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

        field.array && (fieldData.array = true);

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

    if (!schema) {
      throw new Error([
        `Could not set Schema for ${this.name}.`,
        `Please make sure to run any outstanding migrations.`
      ].join('\n'));
    }

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
  * FIXME
  */
  static relationships() {

    return Relationships.of(this);

  }

  /**
  * FIXME
  */
  static relationship(name) {

    this._relationshipCache = this._relationshipCache || {};
    this._relationshipCache[name] = (this._relationshipCache[name] || this.relationships().findExplicit(name));
    return this._relationshipCache[name];

  }

  /**
  * Sets a joins relationship for the Model. Sets joinedBy relationship for parent.
  * @param {class Nodal.Model} Model The Model class which your current model belongs to
  * @param {Object} [options={}]
  *   "name": The string name of the parent in the relationship (default to camelCase of Model name)
  *   "via": Which field in current model represents this relationship, defaults to `${name}_id`
  *   "as": What to display the name of the child as when joined to the parent (default to camelCase of child name)
  *   "multiple": Whether the child exists in multiples for the parent (defaults to false)
  */
  static joinsTo(Model, options) {

    return this.relationships().joinsTo(Model, options);

  }

  /**
  * Create a validator. These run synchronously and check every time a field is set / cleared.
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
  * Creates a verifier. These run asynchronously, support multiple fields, and check every time you try to save a Model.
  * @param {string} message The error message shown if a validation fails.
  * @param {function} fnAction The asynchronous verification method. The last argument passed is always a callback, and field names are determined by the argument names.
  */
  static verifies(message, fnAction) {

    if (!this.prototype.hasOwnProperty('_verificationsList')) {
      this.prototype._verificationsList = [];
    };

    this.prototype._verificationsList.push({
      message: message,
      action: fnAction,
      fields: utilities.getFunctionParameters(fnAction).slice(0, -1)
    });

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
  * Hides fields from being output in .toObject() (i.e. API responses), even if asked for
  * @param {String} field
  */
  static hides(field) {

    if (!this.prototype.hasOwnProperty('_hides')) {
      this.prototype._hides = {};
    }

    this.prototype._hides[field] = true;
    return true;

  }

  /**
  * Tells us if a field is hidden (i.e. from API queries)
  * @param {String} field
  */
  static isHidden(field) {

    return this.prototype._hides[field] || false;

  }

  /**
  * Prepare model for use
  * @private
  */
  __initialize__() {

    this._relationshipCache = {};

    this._joinsCache = {};
    this._joinsList = [];

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
  * @param {optional boolean} fromSeed Specify if the model was generated from a seed. Defaults to false.
  */
  __load__(data, fromStorage, fromSeed) {

    data = data || {};

    this._inStorage = !!fromStorage;
    this._isSeeding = !!fromSeed;

    if (!fromStorage) {
      data.created_at = new Date();
      data.updated_at = new Date();
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

    if (this.relationship(field)) {

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
  * Indicates whethere or not the model is being generated from a seed.
  * @return {boolean}
  */
  isSeeding() {
    return this._isSeeding;
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
  * Grabs the path of the given relationship from the RelationshipGraph
  * @param {string} name the name of the relationship
  */
  relationship(name) {
    return this.constructor.relationship(name);
  }

  /**
  * Sets specified field data for the model. Logs and validates the change.
  * @param {string} field Field to set
  * @param {any} value Value for the field
  */
  set(field, value) {

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

      // If we have an object value (json), do a deterministic diff using
      // node-deep-equals
      // NOTE: Lets do an extra deep object test
      if ( utilities.isObject(value) ) {
        changed = !deepEqual( curValue, value, { strict: true});
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

    let relationship = this.relationship(field);

    if (!relationship.multiple()) {

      if (!(value instanceof relationship.getModel())) {

        throw new Error(`${value} is not an instance of ${relationship.getModel().name}`);

      }

    } else {

      if (!(value instanceof ModelArray) && ModelArray.Model !== relationship.getModel()) {

        throw new Error(`${value} is not an instanceof ModelArray[${relationship.getModel().name}]`);

      }

    }

    if (!this._joinsCache[field]) {
      this._joinsList.push(field);
    }

    this._joinsCache[field] = value;

    return value;

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

    let datum = this._data[field];
    return (!ignoreFormat && this.formatters[field]) ? this.formatters[field](datum) : datum;

  }

  /**
  * Retrieves joined Model or ModelArray
  * @param {String} joinName the name of the join (list of connectors separated by __)
  */
  joined(joinName) {

    return this._joinsCache[joinName];

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

    let invalidJoinNames = joinNames.filter(r => !this.relationship(r));

    if (invalidJoinNames.length) {
      throw new Error(`Joins "${invalidJoinNames.join('", "')}" for model "${this.constructor.name}" do not exist.`);
    }

    let query = this.constructor.query().where({id: this.get('id')});

    joinNames.forEach(joinName => query = query.join(joinName));

    query.end((err, models) => {

      if (err) {
        return callback(err);
      }

      if (!models || !models.length) {
        return callback(new Error('Could not fetch parent'));
      }

      let model = models[0];
      let joins = joinNames.map(joinName => {
        let join = model.joined(joinName);
        join && this.setJoined(joinName, join);
        return join;
      });

      return callback.apply(this, [null].concat(joins));

    });

  };

  /**
  * Creates a plain object from the Model, with properties matching an optional interface
  * @param {Array} arrInterface Interface to use for object creation
  */
  toObject(arrInterface) {

    let obj = {};

    arrInterface = arrInterface ||
      this.fieldList()
      .concat(this._calculationsList)
      .filter(key => !this._hides[key]);

    arrInterface.forEach(key => {

      if (this._hides[key]) {
        return;
      }

      let joinObject;

      if (typeof key === 'object' && key !== null) {
        let subInterface = key;
        key = Object.keys(key)[0];
        joinObject = this._joinsCache[key];
        joinObject && (obj[key] = joinObject.toObject(subInterface[key]));
      } else if (this._data[key] !== undefined) {
        obj[key] = this._data[key];
      } else if (this._calculations[key] !== undefined) {
        obj[key] = this.calculate(key);
      } else if (joinObject = this._joinsCache[key]) {
        obj[key] = joinObject.toObject();
      }

    });

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
    return fieldData && fieldData.properties ? fieldData.properties.defaultValue : null;
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
  * Logic to execute before a model saves. Intended to be overwritten when inherited.
  * @param {Function} callback Invoke with first argument as an error if failure.
  */
  beforeSave(callback) {

    callback(null, this);

  }

  /**
  * Logic to execute after a model saves. Intended to be overwritten when inherited.
  * @param {Function} callback Invoke with first argument as an error if failure.
  */
  afterSave(callback) {

    callback(null, this);

  }

  /**
  * Save a model (execute beforeSave and afterSave)
  * @param {Function} callback Callback to execute upon completion
  */
  save(callback) {

    callback = callback || (() => {});

    async.series([
      this.__verify__,
      this.beforeSave,
      this.__save__,
      this.afterSave
    ].map(f => f.bind(this)), (err) => {
      callback(err || null, this);
    });

  }

  /**
  * Runs an update query for this specific model instance
  * @param {Object} fields Key-value pairs of fields to update
  * @param {Function} callback Callback to execute upon completion
  */
  update(fields, callback) {

    callback = callback || (() => {});

    this.constructor.query()
      .where({id: this.get('id')})
      .update(fields, (err, models) => callback(err, models && models[0]));

  }

  /**
  * Runs all verifications before saving
  * @param {function} callback Method to execute upon completion. Returns true if OK, false if failed
  * @private
  */
  __verify__(callback) {

    if (this.hasErrors()) {
      return callback.call(this, this.errorObject());
    }

    // Run through verifications in order they were added
    async.series(
      this._verificationsList.map(verification => {
        return callback => {
          verification.action.apply(
            this,
            verification.fields
              .map(field => this.get(field))
              .concat(bool => callback(bool ? null : new Error(verification.message)))
          )
        };
      }),
      (err) => {

        if (err) {
          return callback.call(this, err);
        }

        callback(null);

      }
    );

  }

  /**
  * Saves model to database
  * @param {function} callback Method to execute upon completion, returns error if failed (including validations didn't pass)
  * @private
  */
  __save__(callback) {

    let db = this.db;

    // Legacy --- FIXME: Deprecated. Can remove for 1.0
    if (arguments.length === 2) {
      db = arguments[0];
      callback = arguments[1];
    }

    if(typeof callback !== 'function') {
      callback = function() {};
    }

    if (this.fieldList().indexOf('updated_at') !== -1) {
      this.set('updated_at', new Date());
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

        callback.call(this, this.errorObject());

      }
    );

  }

  /**
  * Destroys model and cascades all deletes.
  * @param {function} callback method to run upon completion
  */
  destroyCascade(callback) {

    ModelArray.from([this]).destroyCascade(callback);

  }

  /**
  * Logic to execute before a model gets destroyed. Intended to be overwritten when inherited.
  * @param {Function} callback Invoke with first argument as an error if failure.
  */
  beforeDestroy(callback) {

    callback(null, this);

  }

  /**
  * Logic to execute after a model is destroyed. Intended to be overwritten when inherited.
  * @param {Function} callback Invoke with first argument as an error if failure.
  */
  afterDestroy(callback) {

    callback(null, this);

  }

  /**
  * Destroys model reference in database.
  * @param {function({Error} err, {Nodal.Model} model)} callback
  *   Method to execute upon completion, returns error if failed
  */
  destroy(callback) {

    callback = callback || (() => {});

    async.series([
      this.beforeDestroy,
      this.__destroy__,
      this.afterDestroy
    ].map(f => f.bind(this)), (err) => {
      callback(err || null, this);
    });

  }

  /**
  * Destroys model reference in database
  * @param {function} callback Method to execute upon completion, returns error if failed
  * @private
  */
  __destroy__(callback) {

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

        callback.call(model, err, model);

      }
    );

  }

}

Model.prototype.schema = {
  table: '',
  columns: []
};

Model.prototype._validations = {};
Model.prototype._validationsList = [];

Model.prototype._calculations = {};
Model.prototype._calculationsList = [];

Model.prototype._verificationsList = [];

Model.prototype._hides = {};

Model.prototype.formatters = {};

Model.prototype.data = null;

Model.prototype.db = null;

Model.prototype.externalInterface = [
  'id',
  'created_at',
  'updated_at'
];

Model.prototype.aggregateBy = {
  'id': 'count',
  'created_at': 'min',
  'updated_at': 'min'
};

module.exports = Model;

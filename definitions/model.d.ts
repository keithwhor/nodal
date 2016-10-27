/// <reference types="node" />
import Composer from './composer';
import Database from './db/database';
import ModelArray from './model_array';
import { RelationshipPath, RelationshipNode, RelationshipEdge } from './relationship_graph';
import { IAnyObject, IColumn, IExtendedError } from './types';
export interface IErrorsObject {
    _query?: any;
    [field: string]: string[];
}
export interface ICalculation {
    fields: string[];
    calculate: Function;
}
export interface ICalculations {
    [calculations: string]: ICalculation;
}
declare class Model {
    'constructor': typeof Model;
    db: Database | any;
    schema: {
        table: string;
        columns: IColumn[];
    };
    data: any;
    externalInterface: string[];
    aggregateBy: {
        id: string;
        created_at: string;
        updated_at: string;
    };
    formatters: IAnyObject;
    _inStorage: boolean;
    private _isSeeding;
    private _changed;
    private _errors;
    private _joinsList;
    private _joinsCache;
    private _data;
    _calculations: ICalculations;
    private static _relationshipCache;
    _validations: IAnyObject;
    _validationsList: any[];
    _calculationsList: string[];
    _verificationsList: any;
    _hides: IAnyObject;
    _table: string;
    _columnLookup: {
        [key: string]: any;
    };
    _columnNames: string[];
    _columns: IColumn[];
    _relationshipCache: IAnyObject;
    constructor(modelData: Object, fromStorage?: boolean, fromSeed?: boolean);
    /**
     * Indicates whethere or not the model is currently represented in hard storage (db).
     * @return {boolean}
     */
    inStorage(): boolean;
    /**
     * Indicates whethere or not the model is being generated from a seed.
     * @return {boolean}
     */
    isSeeding(): boolean;
    /**
     * Tells us whether a model field has changed since we created it or loaded it from storage.
     * @param {string} field The model field
     * @return {boolean}
     */
    hasChanged(field: string): boolean;
    /**
     * Provides an array of all changed fields since model was created / loaded from storage
     * @return {Array}
     */
    changedFields(): string[];
    /**
     * Creates an error object for the model if any validations have failed, returns null otherwise
     * @return {Error}
     */
    errorObject(): IExtendedError | null;
    /**
     * Tells us whether or not the model has errors (failed validations)
     * @return {boolean}
     */
    hasErrors(): boolean;
    /**
     * Gives us an error object with each errored field as a key, and each value
     * being an array of failure messages from the validators
     * @return {Object}
     */
    getErrors(): IErrorsObject;
    /**
     * Reads new data into the model.
     * @param {Object} data Data to inject into the model
     * @return {this}
     */
    read(data: IAnyObject): this;
    /**
     * Converts a value to its intended format based on its field. Returns null if field not found.
     * @param {string} field The field to use for conversion data
     * @param {any} value The value to convert
     */
    convert(field: string, value: any): any;
    /**
     * Grabs the path of the given relationship from the RelationshipGraph
     * @param {string} name the name of the relationship
     */
    relationship(name: string): RelationshipPath;
    /**
     * Sets specified field data for the model. Logs and validates the change.
     * @param {string} field Field to set
     * @param {any} value Value for the field
     */
    set(field: string, value: any): any;
    /**
     * Set a joined object (Model or ModelArray)
     * @param {string} field The field (name of the join relationship)
     * @param {Model|ModelArray} value The joined model or array of models
     */
    setJoined(field: string, value: ModelArray | Model): Model | ModelArray;
    /**
     * Calculate field from calculations (assumes it exists)
     *  @param {string} field Name of the calculated field
     */
    calculate(field: string): void;
    /**
     * Retrieve field data for the model.
     * @param {string} field Field for which you'd like to retrieve data.
     */
    get(field: string, ignoreFormat?: boolean): any;
    /**
     * Retrieves joined Model or ModelArray
     * @param {String} joinName the name of the join (list of connectors separated by __)
     */
    joined(joinName: string): Model | ModelArray;
    /**
     * Retrieve associated models joined this model from the database.
     * @param {function({Error} err, {Nodal.Model|Nodal.ModelArray} model_1, ... {Nodal.Model|Nodal.ModelArray} model_n)}
     *   Pass in a function with named parameters corresponding the relationships you'd like to retrieve.
     *   The first parameter is always an error callback.
     */
    include(callback: (err: Error, ...models: (Model | ModelArray)[]) => void): void;
    /**
     * Creates a plain object from the Model, with properties matching an optional interface
     * @param {Array} arrInterface Interface to use for object creation
     */
    toObject(arrInterface?: any[]): any;
    /**
     * Get the table name for the model.
     * @return {string}
     */
    tableName(): string;
    /**
     * Determine if the model has a specified field.
     * @param {string} field
     * @return {boolean}
     */
    hasField(field: string): boolean;
    /**
     * Retrieve the schema field data for the specified field
     * @param {string} field
     * @return {Object}
     */
    getFieldData(field: string): any;
    /**
     * Retrieve the schema data type for the specified field
     * @param {string} field
     * @return {string}
     */
    getDataTypeOf(field: string): {
        convert: Function;
    };
    /**
     * Determine whether or not this field is an Array (PostgreSQL supports this)
     * @param {string} field
     * @return {boolean}
     */
    isFieldArray(field: string): boolean;
    /**
     * Determine whether or not this field is a primary key in our schema
     * @param {string} field
     * @return {boolean}
     */
    isFieldPrimaryKey(field: string): boolean;
    /**
     * Retrieve the defaultValue for this field from our schema
     * @param {string} field
     * @return {any}
     */
    fieldDefaultValue(field: string): any;
    /**
     * Retrieve an array of fields for our model
     * @return {Array}
     */
    fieldList(): string[];
    /**
     * Retrieve our field schema definitions
     * @return {Array}
     */
    fieldDefinitions(): IColumn[];
    /**
     * Set an error for a specified field (supports multiple errors)
     * @param {string} key The specified field for which to create the error (or '*' for generic)
     * @param {string} message The error message
     * @return {boolean}
     */
    setError(key: string, message: string): boolean;
    /**
     * Clears all errors for a specified field
     * @param {string} key The specified field for which to create the error (or '*' for generic)
     * @return {boolean}
     */
    clearError(key: string): boolean;
    __generateSaveQuery__(): {
        sql: any;
        params: any;
    };
    /**
     * Runs all verifications before saving
     * @param {function} callback Method to execute upon completion. Returns true if OK, false if failed
     * @private
     */
    __verify__(callback: Function): any;
    /**
     * Saves model to database
     * @param {function} callback Method to execute upon completion, returns error if failed (including validations didn't pass)
     * @private
     */
    private __save__(callback);
    /**
     * Destroys model and cascades all deletes.
     * @param {function} callback method to run upon completion
     */
    destroyCascade(callback: Function): void;
    /**
     * Logic to execute before a model gets destroyed. Intended to be overwritten when inherited.
     * @param {Function} callback Invoke with first argument as an error if failure.
     */
    beforeDestroy(callback: Function): void;
    /**
     * Logic to execute after a model is destroyed. Intended to be overwritten when inherited.
     * @param {Function} callback Invoke with first argument as an error if failure.
     */
    afterDestroy(callback: Function): void;
    /**
     * Destroys model reference in database.
     * @param {function({Error} err, {Nodal.Model} model)} callback
     *   Method to execute upon completion, returns error if failed
     */
    destroy(callback: Function): void;
    /**
     * Logic to execute before a model saves. Intended to be overwritten when inherited.
     * @param {Function} callback Invoke with first argument as an error if failure.
     */
    beforeSave(callback: Function): void;
    /**
     * Logic to execute after a model saves. Intended to be overwritten when inherited.
     * @param {Function} callback Invoke with first argument as an error if failure.
     */
    afterSave(callback: Function): void;
    /**
     * Save a model (execute beforeSave and afterSave)
     * @param {Function} callback Callback to execute upon completion
     */
    save(callback: Function): void;
    /**
     * Runs an update query for this specific model instance
     * @param {Object} fields Key-value pairs of fields to update
     * @param {Function} callback Callback to execute upon completion
     */
    update(fields: IAnyObject, callback: Function): void;
    static find(id: number, callback: (err: IExtendedError, model?: Model) => void): void;
    static findBy(field: string, value: any, callback: (err: IExtendedError, model?: Model) => void): void;
    /**
     * Creates a new model instance using the provided data.
     * @param {object} data The data to load into the object.
     * @param {function({Error} err, {Nodal.Model} model)} callback The callback to execute upon completion
     */
    static create(data: IAnyObject, callback: (err: IExtendedError, model?: Model) => void): void;
    /**
     * Finds a model with a provided field, value pair. Returns the first found.
     * @param {string} field Name of the field
     * @param {object} data Key-value pairs of Model creation data. Will use appropriate value to query for based on "field" parametere.
     * @param {function({Error} err, {Nodal.Model} model)} callback The callback to execute upon completion
     */
    static findOrCreateBy(field: string, data: IAnyObject, callback: (err: IExtendedError | null, model?: Model) => void): void;
    /**
     * Finds and updates a model with a specified id. Return a notFound error if model does not exist.
     * @param {number} id The id of the model you're looking for
     * @param {object} data The data to load into the object.
     * @param {function({Error} err, {Nodal.Model} model)} callback The callback to execute upon completion
     */
    static update(id: number, data: IAnyObject, callback: (err: IExtendedError, model?: Model) => void): void;
    /**
     * Finds and destroys a model with a specified id. Return a notFound error if model does not exist.
     * @param {number} id The id of the model you're looking for
     * @param {function({Error} err, {Nodal.Model} model)} callback The callback to execute upon completion
     */
    static destroy(id: number, callback: (err: IExtendedError, model?: Model) => void): void;
    /**
     * Creates a new Composer (ORM) instance to begin a new query.
     * @param {optional Nodal.Database} db Deprecated - provide a database to query from. Set the model's db in its constructor file, instead.
     * @return {Nodal.Composer}
     */
    static query(db?: Database): Composer;
    /**
     * Get the model's table name
     * @return {string}
     */
    static table(): string;
    /**
     * Get the model's column data
     * @return {Array}
     */
    static columns(): IColumn[];
    /**
     * Get the model's column names (fields)
     * @return {Array}
     */
    static columnNames(): string[];
    /**
     * Get the model's column lookup data
     * @return {Object}
     */
    static columnLookup(): IAnyObject;
    /**
     * Check if the model has a column name in its schema
     * @param {string} columnName
     */
    static hasColumn(columnName: string): boolean;
    /**
     * Return the column schema data for a given name
     * @param {string} columnName
     */
    static column(columnName: string): any;
    /**
     * Set the database to be used for this model
     * @param {Nodal.Database} db
     */
    static setDatabase(db: Database): void;
    /**
     * Set the schema to be used for this model
     * @param {Object} schema
     */
    static setSchema(schema: {
        table: string;
        columns: IColumn[];
    }): void;
    /**
     * FIXME
     */
    static relationships(): RelationshipNode;
    /**`
     * FIXME
     */
    static relationship(name: string): RelationshipPath;
    /**
     * Sets a joins relationship for the Model. Sets joinedBy relationship for parent.
     * @param {class Nodal.Model} Model The Model class which your current model belongs to
     * @param {Object} [options={}]
     *   "name": The string name of the parent in the relationship (default to camelCase of Model name)
     *   "via": Which field in current model represents this relationship, defaults to `${name}_id`
     *   "as": What to display the name of the child as when joined to the parent (default to camelCase of child name)
     *   "multiple": Whether the child exists in multiples for the parent (defaults to false)
     */
    static joinsTo(modelClass: typeof Model, options: {
        name: string;
        via: string;
        as: string;
        multiple: boolean;
    }): RelationshipEdge | null;
    /**
     * Create a validator. These run synchronously and check every time a field is set / cleared.
     * @param {string} field The field you'd like to validate
     * @param {string} message The error message shown if a validation fails.
     * @param {function({any} value)} fnAction the validation to run - first parameter is the value you're testing.
     */
    static validates(field: string, message: string, fnAction: (value: any) => void): void;
    /**
     * Creates a verifier. These run asynchronously, support multiple fields, and check every time you try to save a Model.
     * @param {string} message The error message shown if a validation fails.
     * @param {function} fnAction The asynchronous verification method. The last argument passed is always a callback,
     * and field names are determined by the  argument names.
     */
    static verifies(message: string, fnAction: Function): void;
    /**
     * Create a calculated field (in JavaScript). Must be synchronous.
     * @param {string} calcField The name of the calculated field
     * @param {function} fnCalculate The synchronous method to perform a calculation for.
     *   Pass the names of the (non-computed) fields you'd like to use as parameters.
     */
    static calculates(calcField: string, fnCompute: Function): void;
    /**
     * Hides fields from being output in .toObject() (i.e. API responses), even if asked for
     * @param {String} field
     */
    static hides(field: string): boolean;
    /**
     * Tells us if a field is hidden (i.e. from API queries)
     * @param {String} field
     */
    static isHidden(field: string): any;
    /**
     * Prepare model for use
     * @private
     */
    private __initialize__();
    __load__(data: any, fromStorage?: boolean, fromSeed?: boolean): this;
    /**
     * Validates provided fieldList (or all fields if not provided)
     * @private
     * @param {optional Array} fieldList fields to validate
     */
    private __validate__(field?);
    /**
     * Sets specified field data for the model, assuming data is safe and does not log changes
     * @param {string} field Field to set
     * @param {any} value Value for the field
     */
    private __safeSet__(field, value);
    /**
     * Destroys model reference in database
     * @param {function} callback Method to execute upon completion, returns error if failed
     * @private
     */
    private __destroy__(callback);
}
export default Model;

/// <reference types="node" />
import Database from './db/database';
import Model from './model';
import ModelArray from './model_array';
import { IAnyObject } from './types';
export interface IComparison {
    [item: string]: any;
    __order?: string;
    __offset?: number;
    __count?: number;
}
/**
 * The query composer (ORM)
 * @class
 */
declare class Composer {
    db: Database;
    Model: typeof Model;
    private _parent;
    private _command;
    /**
     * Created by Model#query, used for composing SQL queries based on Models
     * @param {Nodal.Model} Model The model class the composer is querying from
     * @param {Nodal.Composer} [parent=null] The composer's parent (another composer instance)
     */
    constructor(modelConstructor: typeof Model, parent?: Composer);
    /**
     * Given rows with repeated data (due to joining in multiple children),
     * return only parent models (but include references to their children)
     * @param {Array} rows Rows from sql result
     * @param {Boolean} grouped Are these models grouped, if so, different procedure
     * @return {Nodal.ModelArray}
     * @private
     */
    private __parseModelsFromRows__(rows, grouped?);
    /**
     * Collapses linked list of queries into an array (for .reduce, .map etc)
     * @return {Array}
     * @private
     */
    private __collapse__();
    /**
     * Removes last limit command from a collapsed array of composer commands
     * @param {Array} [composerArray] Array of composer commands
     * @return {Array}
     * @private
     */
    private __removeLastLimitCommand__(composerArray);
    /**
     * Gets last limit command from a collapsed array of composer commands
     * @param {Array} [composerArray] Array of composer commands
     * @return {Array}
     * @private
     */
    private __getLastLimitCommand__(composerArray);
    /**
     * Determines whether this composer query represents a grouped query or not
     * @return {Boolean}
     * @private
     */
    private __isGrouped__();
    /**
     * Reduces an array of composer queries to a single query information object
     * @param {Array} [composerArray]
     * @return {Object} Looks like {commands: [], joins: []}
     * @private
     */
    private __reduceToQueryInformation__(composerArray);
    /**
     * Reduces an array of commands from query informtion to a SQL query
     * @param {Array} [commandArray]
     * @param {Array} [includeColumns=*] Which columns to include, includes all by default
     * @return {Object} Looks like {sql: [], params: []}
     * @private
     */
    private __reduceCommandsToQuery__(commandArray, includeColumns?);
    /**
     * Retrieve all joined column data for a given join
     * @param {string} joinName The name of the join relationship
     * @private
     */
    private __joinedColumns__(joinName);
    /**
     * Generate a SQL query and its associated parameters from the current composer instance
     * @param {Array} [includeColumns=*] Which columns to include, includes all by default
     * @param {boolean} [disableJoins=false] Disable joins if you just want a subset of data
     * @return {Object} Has "params" and "sql" properties.
     * @private
     */
    private __generateQuery__(includeColumns?, disableJoins?);
    /**
     * Generate a SQL count query
     * @param {boolean} [useLimit=false] Generates COUNT using limit command as well
     * @return {Object} Has "params" and "sql" properties.
     * @private
     */
    private __generateCountQuery__(useLimit?);
    /**
     * Add Joins to a query from queryInfo
     * @param {Object} query Must be format {sql: '', params: []}
     * @param {Object} queryInfo Must be format {commands: [], joins: []}
     * @param {Array} [includeColumns=*] Which columns to include, includes all by default
     * @return {Object} Has "params" and "sql" properties.
     * @private
     */
    private __addJoinsToQuery__(query, queryInfo, includeColumns?);
    /**
     * When using Composer#where, format all provided comparisons
     * @param {Object} comparisons Comparisons object. {age__lte: 27}, for example.
     * @param {Nodal.Model} Model the model to use as the basis for comparison. Default to current model.
     * @return {Array}
     * @private
     */
    private __parseComparisons__(comparisons, model?);
    private __filterHidden__(modelConstructor, comparisonsArray);
    /**
     * Add comparisons to SQL WHERE clause. Does not allow filtering if Model.hides() has been called.
     * @param {Object} comparisons Comparisons object. {age__lte: 27}, for example.
     * @return {Nodal.Composer} new Composer instance
     */
    safeWhere(...comparisonsArray: IComparison[]): Composer;
    /**
     * Join in a relationship. Filters out hidden fields from comparisons.
     * @param {string} joinName The name of the joined relationship
     * @param {array} comparisonsArray comparisons to perform on this join (can be overloaded)
     */
    safeJoin(joinName: string, ...comparisonsArray: IComparison[]): Composer;
    /**
     * Add comparisons to SQL WHERE clause.
     * @param {Object} comparisons Comparisons object. {age__lte: 27}, for example.
     * @return {Nodal.Composer} new Composer instance
     */
    where(...comparisonsArray: IComparison[]): Composer;
    /**
     * Order by field belonging to the current Composer instance's model.
     * @param {string} field Field to order by
     * @param {string} direction Must be 'ASC' or 'DESC'
     * @return {Nodal.Composer} new Composer instance
     */
    orderBy(field: string, direction?: 'ASC' | 'DSC' | any): Composer;
    /**
     * Limit to an offset and count
     * @param {number} offset The offset at which to set the limit. If this is the only argument provided, it will be the count instead.
     * @param {number} count The number of results to be returned. Can be omitted, and if omitted, first argument is used for count.
     * @return {Nodal.Composer} new Composer instance
     */
    limit(offset: number | string, count?: number | string): Composer;
    /**
     * Join in a relationship.
     * @param {string} joinName The name of the joined relationship
     * @param {array} comparisonsArray comparisons to perform on this join (can be overloaded)
     */
    join(joinName: string, comparisonsArray?: IComparison[] | IComparison, orderBy?: 'ASC' | 'DESC', count?: number, offset?: number): Composer;
    /**
     * Groups by a specific field, or a transformation on a field
     * @param {String} column The column to group by
     */
    groupBy(column: string): Composer;
    /**
     * Aggregates a field
     * @param {String} alias The alias for the new aggregate field
     * @param {Function} transformation The transformation to apply to create the aggregate
     */
    aggregate(alias: string, transformation?: Function): Composer;
    /**
     * Counts the results in the query
     * @param {function} callback Supplied with an error and the integer value of the count
     */
    count(callback: (err: Error, count: number) => void): void;
    /**
     * Execute the query you've been composing.
     * @param {function({Error}, {Nodal.ModelArray})} callback The method to execute when the query is complete
     */
    end(callback: (err: Error, modelArray: ModelArray) => void): void;
    /**
     * Shortcut for .limit(1).end(callback) that only returns a model object or error if not found
     * @param {Function} callback Callback to execute, provides an error and model parameter
     */
    first(callback: (err: Error, model: Model) => void): void;
    /**
     * Execute query as an update query, changed all fields specified.
     * @param {Object} fields The object containing columns (keys) and associated values you'd like to update
     * @param {function({Error}, {Nodal.ModelArray})} callback The callback for the update query
     */
    update(fields: IAnyObject, callback: (err: Error, modelArray: ModelArray) => void): void;
}
export default Composer;

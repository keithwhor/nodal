import Model from './model';
/**
 * GraphQuery class that translates GraphQL to something digestible by the Composer
 * @class
 */
declare class GraphQuery {
    private 'constructor';
    identifier: string;
    name: string;
    Model: typeof Model;
    structure: any;
    joins: any;
    /**
     * Create a GraphQuery object
     * @param {String} str The query to execute
     * @param {Number} maxDepth The maximum depth of graph to traverse
     * @param {Nodal.Model} [Model=null] The Model to base your query around (used for testing)
     */
    constructor(str: string, maxDepth: number, mModel?: typeof Model);
    /**
     * Create and execute a GraphQuery object
     * @param {String} str The query to execute
     * @param {Number} maxDepth The maximum depth of graph to traverse
     * @param {Function} callback The function to execute upon completion
     */
    static query(str: string, maxDepth: number, callback: Function): boolean;
    /**
     * Parse syntax tree of a GraphQL query
     */
    static parseSyntaxTree(str: string, state?: string, arr?: any[]): any;
    /**
     * Fully parse a GraphQL query, get necessary joins to make in SQL
     */
    static parse(str: string, max: number): {
        structure: any;
        joins: {};
    };
    /**
     * Format a parsed syntax tree in a way that the Composer expects
     */
    static formatTree(tree: any[], max: number, joins: any, parents?: any): any[];
    /**
     * Query the GraphQuery object from the database
     * @param {Function} callback The function to execute upon completion
     */
    query(callback: Function): this;
}
export default GraphQuery;

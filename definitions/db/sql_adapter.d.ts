import { IColumn, IColumnProperties } from '../types';
export declare type ComparatorType = 'is' | 'not' | 'lt' | 'lte' | 'gt' | 'gte' | 'contains' | 'icontains' | 'startswith' | 'istartswith' | 'endswith' | 'iendswith' | 'like' | 'ilike' | 'is_null' | 'not_null' | 'in' | 'not_in';
export interface IComparator {
    [typeKey: string]: Function;
}
export interface IWhereObject {
    table: string;
    columnName: string;
    refName: string;
    comparator: ComparatorType;
    value: any;
    ignoreValue: boolean;
    joined: any;
    joins: any;
}
declare abstract class SQLAdapter {
    abstract generateConnectionString(host: string, port: number, database: string, user: string, password: string): string;
    abstract parseConnectionString(str: string): void;
    abstract generateClearDatabaseQuery(): string;
    abstract generateCreateDatabaseQuery(...args: any[]): string;
    abstract generateDropDatabaseQuery(...args: any[]): string;
    abstract generateIndex(...args: any[]): string;
    abstract generateConstraint(...args: any[]): string;
    abstract generateColumn(columnName: string, type: string, properties?: IColumnProperties): string;
    abstract generateAlterColumn(columnName: string, type: string, properties?: IColumnProperties): string;
    abstract generateAlterColumnSetNull(columnName: string, type: string, properties?: IColumnProperties): string;
    abstract generatePrimaryKey(columnName: string, type: string, properties?: IColumnProperties): string;
    abstract generateUniqueKey(columnName: string, type: string, properties?: IColumnProperties): string;
    abstract generateAlterTableRename(table: string, newTableName: string, columns?: any): string;
    abstract generateAlterTableColumnType(table: string, columnName: string, columnType: string, columnProperties: IColumnProperties): string;
    abstract generateAlterTableAddPrimaryKey(table: string, columnName: string): string;
    abstract generateAlterTableDropPrimaryKey(table: string, columnName: string): string;
    abstract generateAlterTableAddUniqueKey(table: string, columnName: string): string;
    abstract generateAlterTableDropUniqueKey(table: string, columnName: string): string;
    abstract generateAlterTableAddColumn(table: string, columnName: string, columnType: string, columnProperties: IColumnProperties): string;
    abstract generateAlterTableDropColumn(table: string, columnName: string): string;
    abstract generateAlterTableRenameColumn(table: string, columnName: string, newColumnName: string): string;
    abstract generateCreateIndex(table: string, columnName: string, indexType: any): string;
    abstract generateDropIndex(table: string, columnName: string): string;
    abstract generateSimpleForeignKeyQuery(table: string, referenceTable: string): string;
    abstract generateDropSimpleForeignKeyQuery(table: string, referenceTable: string): string;
    sanitizeType: {
        [typeKey: string]: Function;
    };
    escapeFieldCharacter: string;
    types: {
        [typeName: string]: {
            dbName: string;
            properties?: IColumnProperties;
        };
    };
    typePropertyDefaults: IColumnProperties;
    typeProperties: string[];
    comparatorIgnoresValue: {
        is_null: boolean;
        not_null: boolean;
        [key: string]: any;
    };
    comparators: {
        [key: string]: Function;
    };
    aggregates: {
        [key: string]: Function;
    };
    defaultAggregate: string;
    columnDepthDelimiter: string;
    whereDepthDelimiter: string;
    supportsForeignKey: boolean;
    documentTypes: string[];
    indexTypes: string[];
    sanitize(type: string, value: any): any;
    escapeField(name: string): string;
    getTypeProperties(typeName: string, optionalValues: any): any;
    getTypeDbName(typeName: string): string;
    generateColumnsStatement(table: string, columns: IColumn[]): string;
    getAutoIncrementKeys(columns: IColumn[]): IColumn[];
    getPrimaryKeys(columns: IColumn[]): IColumn[];
    getUniqueKeys(columns: IColumn[]): IColumn[];
    generatePrimaryKeysStatement(table: string, columns: IColumn[]): string;
    generateUniqueKeysStatement(table: string, columns: IColumn[]): string;
    generateCreateTableQuery(table: string, columns: IColumn[]): string;
    generateDropTableQuery(table: string, ifExists: boolean): string;
    generateTruncateTableQuery(table: string): string;
    generateSelectQuery(subQuery: any, table: string, columns: IColumn[], multiFilter: any, joinArray: any[], groupByArray: any[], orderByArray: any[], limitObj: any, paramOffset: any): string;
    generateCountQuery(subQuery: string, table: string): string;
    generateUpdateQuery(table: string, columnNames: any): string;
    generateUpdateAllQuery(table: string, pkColumn: string, columnNames: string[], columnFunctions: any, offset?: number, subQuery?: any): string;
    generateDeleteQuery(table: string, columnNames: string[]): string;
    generateDeleteAllQuery(table: string, columnName: string, values: any, joins: any): string;
    generateInsertQuery(table: string, columnNames: string[]): string;
    generateAlterTableQuery(table: string, columnName: string, type: string, properties: any): string;
    generateAlterTableAddColumnQuery(table: string, columnName: string, type: string, properties: any): string;
    generateAlterTableDropColumnQuery(table: string, columnName: string): string;
    generateAlterTableRenameColumnQuery(table: string, columnName: string, newColumnName: string): string;
    generateCreateIndexQuery(table: string, columnName: string, indexType: string): string;
    generateDropIndexQuery(table: string, columnName: string): string;
    preprocessWhereObj(table: string, whereObj: IWhereObject[]): IWhereObject[];
    parseWhereObj(table: string, whereObj: IWhereObject[]): {
        table: string;
        columnName: string;
        refName: string;
        comparator: ComparatorType;
        value: any;
        ignoreValue: boolean;
        joined: any;
        joins: any;
    }[];
    createMultiFilter(table: string, whereObjArray: any): any;
    generateWhereClause(table: string, multiFilter: any, paramOffset: any): string;
    generateOrClause(table: string, multiFilter: any, paramOffset: any): string;
    generateAndClause(table: string, whereObjArray: any): string;
    getParamsFromMultiFilter(multiFilter: any): any;
    generateOrderByClause(table: string, orderByArray: any[], groupByArray: any[]): string;
    generateJoinClause(table: string, joinArray: any, paramOffset: any): any;
    generateGroupByClause(table: string, groupByArray: any): string;
    generateLimitClause(limitObj: any): string;
    aggregate(aggregator: any): any;
}
export default SQLAdapter;

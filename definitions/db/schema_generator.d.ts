import { DataType, IColumnProperties } from '../types';
import Database from './database';
export interface IIndice {
    table: string;
    column: string;
    type: DataType;
}
export interface IColumnData {
    name: string;
    type: DataType;
    properties: IColumnProperties;
}
export interface IModel {
    table: string;
    columns: IColumnData[];
}
export interface IModels {
    [modelKey: string]: IModel;
}
declare class SchemaGenerator {
    private db;
    private migrationId;
    private models;
    private indices;
    private _defaultPath;
    constructor(db: Database);
    load(filename: string): boolean;
    fetch(callback: Function): void;
    save(filename?: string): boolean;
    mergeProperties(columnData: any, properties?: any): any;
    set(schema: {
        migration_id: string;
        models: IModels;
        indices: IIndice[];
    }): boolean;
    setMigrationId(id: string | null): void;
    findClass(table: string): string;
    createTable(table: string, arrColumnData: any[], modelName: string): any[];
    dropTable(table: string): boolean;
    renameTable(table: string, newTableName: string, renameModel: string, newModelName: string): IModel;
    alterColumn(table: string, column: string, type: DataType, properties: IColumnProperties): boolean;
    addColumn(table: string, column: string, type: DataType, properties: IColumnProperties): boolean;
    dropColumn(table: string, column: string): boolean;
    renameColumn(table: string, column: string, newColumn: string): boolean;
    createIndex(table: string, column: string, type: DataType): boolean;
    dropIndex(table: string, column: string): boolean;
    addForeignKey(table: string, referenceTable: string): boolean;
    dropForeignKey(table: string, referenceTable: string): boolean;
    read(json: string): boolean;
    generate(): string;
}
export default SchemaGenerator;

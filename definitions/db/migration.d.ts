/// <reference types="node" />
import { DataType, IColumnProperties } from '../types';
import Database from './database';
declare class Migration {
    private db;
    private id;
    private schema;
    constructor(db: Database);
    up(): string[];
    down(): string[];
    executeUp(callback: (err: Error) => void): void;
    executeDown(callback: (err: Error) => void, prevId?: string): void;
    createTable(table: string, arrFieldData: Object[], modelName: string): any;
    dropTable(table: string): any;
    renameTable(table: string, newTableName: string, renameModel: string, newModelName: string): any;
    alterColumn(table: string, column: string, type: DataType, properties: IColumnProperties): any;
    addColumn(table: string, column: string, type: DataType, properties: IColumnProperties): any;
    dropColumn(table: string, column: string): any;
    renameColumn(table: string, column: string, newColumn: string): any;
    createIndex(table: string, column: string, type: DataType): any;
    dropIndex(table: string, column: string): any;
    addForeignKey(table: string, referenceTable: string): any;
    dropForeignKey(table: string, referenceTable: string): any;
}
export default Migration;

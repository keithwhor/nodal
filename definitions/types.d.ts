/// <reference types="node" />
import Model from './model';
export interface IAnyObject {
    [prop: string]: any;
}
export interface IExtendedError extends Error {
    notFound?: boolean;
    details?: Object;
}
export interface IColumn {
    name: string;
    type: DataType;
    properties: IColumnProperties;
}
export interface ISchema {
    table: string;
    columns: IColumn[];
}
export interface IJoin {
    prevColumn?: string;
    joinColumn?: string;
    joinTable: string;
    prevTable: string;
    name?: string;
    key?: string;
    multiple?: boolean;
    columns?: string[];
    columnsObject?: Object;
    cachedModel?: Model;
    joinAlias?: string;
    multiFilter?: any;
    prevAlias?: string;
    orderBy?: any;
    offset?: number;
    count?: number;
}
export declare type Query = any;
export interface IColumnProperties {
    length?: number | null;
    nullable?: boolean;
    primary_key?: 0 | 1 | boolean;
    auto_increment?: boolean;
    unique?: 0 | 1 | boolean;
    array?: boolean;
    defaultValue?: any;
}
export interface IArrInterface {
    [item: string]: [string];
}
export declare type InterfaceType = IArrInterface | string;
export declare type DataType = 'serial' | 'int' | 'currency' | 'float' | 'string' | 'text' | 'datetime' | 'boolean' | 'json';

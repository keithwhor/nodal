export interface IArrayMetadata {
    total?: number;
    offset?: number;
    [other: string]: any;
}
declare class ItemArray<T> extends Array<T> {
    private _meta;
    constructor();
    static from(arr: Object[]): ItemArray<{}>;
    setMeta(data: IArrayMetadata): IArrayMetadata;
    toObject(arrInterface: string[]): Object;
}
export default ItemArray;

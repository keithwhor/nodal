import ItemArray from './item_array.js';
import Model from './model';
declare class ModelArray extends ItemArray<Model> {
    Model: typeof Model;
    constructor(modelConstructor: typeof Model);
    static from(arr: Model[]): ModelArray;
    toObject(arrInterface?: string[]): any;
    has(model: Model): boolean;
    readAll(data: Object): boolean;
    setAll(field: string, value: string): boolean;
    destroyAll(callback: Function): void;
    destroyCascade(callback: Function): void;
    saveAll(callback: Function): Function | undefined;
    private __saveAll__(callback);
}
export default ModelArray;

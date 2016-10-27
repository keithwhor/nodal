import Model from './model';
export interface IModelData {
    [modelName: string]: any[];
}
/**
 * Factory for creating models
 * @class
 */
declare class ModelFactory {
    private Model;
    /**
     * Create the ModelFactory with a provided Model to use as a reference.
     * @param {Nodal.Model} modelConstructor Must pass the constructor for the type of ModelFactory you wish to create.
     */
    constructor(modelConstructor: typeof Model);
    /**
     * Loads all model constructors in your ./app/models directory into an array
     * @return {Array} Array of model Constructors
     */
    static loadModels(): any[];
    /**
     * Creates new factories from a supplied array of Models, loading in data keyed by Model name
     * @param {Array} Models Array of model constructors you wish to reference
     * @param {Object} objModelData Keys are model names, values are arrays of model data you wish to create
     * @param {Function} callback What to execute upon completion
     */
    static createFromModels(Models: (typeof Model)[], objModelData: IModelData, callback: Function): void;
    /**
     * Populates a large amount of model data from an Object.
     * @param {Array} Models Array of Model constructors
     */
    static populate(objModelData: IModelData, callback: Function): void;
    /**
     * Creates models from an array of Objects containing the model data
     * @param {Array} arrModelData Array of objects to create model data from
     */
    create(arrModelData: IModelData[], callback: Function): void;
}
export default ModelFactory;

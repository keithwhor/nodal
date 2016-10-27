export interface IDataTypes {
    [type: string]: {
        convert: (v: any) => any;
    };
}
declare const dataTypes: IDataTypes;
export default dataTypes;

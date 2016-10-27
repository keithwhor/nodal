export declare class APIConstructor {
    format(obj: any, arrInterface?: string[]): {
        meta: {
            total: number;
            count: number;
            offset: number;
            error: any;
            summary: string | null | undefined;
            resource: any;
        };
        data: any;
    };
    meta(total: number, count: number, offset: number, error: any, summary?: string | null, resource?: any): {
        total: number;
        count: number;
        offset: number;
        error: any;
        summary: string | null | undefined;
        resource: any;
    };
    error(message: string, details: string): {
        meta: {
            total: number;
            count: number;
            offset: number;
            error: any;
            summary: string | null | undefined;
            resource: any;
        };
        data: never[];
    };
    spoof(obj: any, useResource?: boolean): {
        meta: {
            total: number;
            count: number;
            offset: number;
            error: any;
            summary: string | null | undefined;
            resource: any;
        };
        data: any;
    };
    response(itemArray: any, arrInterface: any, useResource?: boolean): {
        meta: {
            total: number;
            count: number;
            offset: number;
            error: any;
            summary: string | null | undefined;
            resource: any;
        };
        data: any;
    };
    resourceFromArray(arr: any[]): {
        name: string;
        fields: any[];
    };
    resourceFromModelArray(modelArray: any, arrInterface: any): any;
}
declare const API: APIConstructor;
export default API;

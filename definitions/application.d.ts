import * as fxn from 'fxn';
declare class Application extends fxn.Application {
    constructor();
    /**
     * HTTP Error
     */
    error(req: any, res: any, start: any, status: number, message: string, err: any): void;
}
export default Application;

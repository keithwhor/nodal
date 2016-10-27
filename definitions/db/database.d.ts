declare class Database {
    adapter: any;
    __logColorFuncs: Function[];
    private _useLogColor;
    constructor();
    connect(cfg: any): boolean;
    close(callback: Function): boolean;
    log(sql: string, params?: any, time?: number): boolean;
    info(message: string): void;
    error(message: string): boolean;
    query(...args: any[]): void;
    transaction(...args: any[]): void;
    drop(): void;
    create(): void;
}
export default Database;

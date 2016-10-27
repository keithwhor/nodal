import fxn from 'fxn';
/**
 * Multi-process HTTP Daemon that resets when files changed (in development)
 * @class
 */
declare class Daemon extends fxn.Daemon {
    constructor();
    error(req: any, res: any, err: any): void;
}
export default Daemon;

/// <reference types="node" />
import Model from './model';
import ModelArray from './model_array';
import * as fxn from 'fxn';
declare class Controller extends fxn.Controller {
    /**
     * Set HTTP status code for this response. If OPTIONS mode, default to 200.
     * @param {Number} code
     */
    status(value: number): boolean;
    /**
     * Using API formatting, send an http.ServerResponse indicating there was a Bad Request (400)
     * @param {string} msg Error message to send
     * @param {Object} details Any additional details for the error (must be serializable)
     * @return {boolean}
     */
    badRequest(msg: string, details: any): boolean;
    /**
     * Using API formatting, send an http.ServerResponse indicating there was an Unauthorized request (401)
     * @param {string} msg Error message to send
     * @param {Object} details Any additional details for the error (must be serializable)
     * @return {boolean}
     */
    unauthorized(msg: string, details: any): boolean;
    /**
     * Using API formatting, send an http.ServerResponse indicating the requested resource was Not Found (404)
     * @param {string} msg Error message to send
     * @param {Object} details Any additional details for the error (must be serializable)
     * @return {boolean}
     */
    notFound(msg: string, details: any): boolean;
    /**
     * Endpoint not implemented
     * @param {string} msg Error message to send
     * @param {Object} details Any additional details for the error (must be serializable)
     * @return {boolean}
     */
    notImplemented(msg: string, details: any): boolean;
    /**
     * Using API formatting, send an http.ServerResponse indicating there were Too Many Requests (429) (i.e. the client is being rate limited)
     * @param {string} msg Error message to send
     * @param {Object} details Any additional details for the error (must be serializable)
     * @return {boolean}
     */
    tooManyRequests(msg: string, details: any): boolean;
    /**
     * Using API formatting, send an http.ServerResponse indicating there was an Internal Server Error (500)
     * @param {string} msg Error message to send
     * @param {Object} details Any additional details for the error (must be serializable)
     * @return {boolean}
     */
    error(msg: string, details: any): boolean;
    /**
     * Using API formatting, generate an error or respond with model / object data.
     * @param {Error|Object|Array|Nodal.Model|Nodal.ModelArray} data Object to be formatted for API response
     * @param {optional Array} The interface to use for the data being returned, if not an error.
     * @return {boolean}
     */
    respond(data: Error | Object | any[] | Model | ModelArray, arrInterface?: string[]): boolean;
}
export default Controller;

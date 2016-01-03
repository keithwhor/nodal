module.exports = (function() {

  'use strict';

  const async = require('async');

  /**
  * Queues initializers, middleware, etc (make sure they fire in order).
  * @class
  */
  class ExecutionQueue {

    constructor() {
      this._queue= [];
    }

    /**
    * Tell the manager to put an object in the queue.
    * @param {Object} itemConstructor The item constructor (must have exec function) you wish to add to the queue.
    */
    use(itemConstructor) {

      let item = new itemConstructor();
      this._queue.push(item);

    }

    /**
    * Execute all items, in order. First parameter is a "steady" object that will
    * be passed by reference to every item in the queue as the first parameter of exec.
    * Middle parameters are passed by previous item#exec calls (as parameters, after err),
    * and last parameter is a completion callback.
    */
    exec() {

      let args = [].slice.call(arguments);

      let fnComplete = args.pop();
      let steady = args.shift();

      if (typeof steady !== 'object' || steady === null) {
        steady = {};
      }

      if (typeof fnComplete !== 'function') {
        args.push(fnComplete);
        fnComplete = () => {};
      }

      let execArray = [
        function(callback) {
          callback.apply(null, [null].concat(args));
        }
      ].concat(
        this._queue.map(item => {
          return function() {
            item.exec.apply(item, [steady].concat([].slice.call(arguments)));
          };
        })
      );

      async.waterfall(execArray, fnComplete);

    }

  }

  return ExecutionQueue;

})();

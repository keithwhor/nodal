module.exports = (function() {

  'use strict';

  const async = require('async');

  /**
  * Queues initializers, middleware, etc (make sure they fire in order).
  * @class
  */
  class ExecutionQueue {

    constructor() {
      this._queue = [];
    }

    prepend(executionQueue) {
      if (!(executionQueue instanceof ExecutionQueue)) {
        throw new Error('Can only prepend another execution queue');
      }
      this._queue = executionQueue._queue.concat(this._queue);
    }

    append(executionQueue) {
      if (!(executionQueue instanceof ExecutionQueue)) {
        throw new Error('Can only append another execution queue');
      }
      this._queue = this._queue.concat(executionQueue._queue);
    }

    /**
    * Tell the manager to put an object in the queue (last)
    * @param {Object} arguments The item constructor (must have exec function) plus other arguments you wish to add to the queue.
    */
    use() {

      let args = [].slice.call(arguments);

      if (args.length) {
        let itemConstructor = args[0];
        let item = new (itemConstructor.bind.apply(itemConstructor, args))();

        this._queue.push(item);
      }

    }

    /**
    * Alias for ExecutionQueue#use
    */
    push() {

      this.use.apply(this, arguments);

    }

    /**
    * Tell the manager to put an object in the queue (first)
    * @param {Object} arguments The item constructor (must have exec function) plus other arguments you wish to add to the queue.
    */
    unshift() {

      let args = [].slice.call(arguments);

      if (args.length) {
        let itemConstructor = args[0];
        let item = new (itemConstructor.bind.apply(itemConstructor, args))();

        this._queue.unshift(item);
      }

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
      let steady = args.splice(0, 1);

      if (steady.length && typeof steady[0] !== 'object' || steady[0] === null) {
        steady[0] = {};
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
            item.exec.apply(item, steady.concat([].slice.call(arguments)));
          };
        })
      );

      async.waterfall(execArray, fnComplete);

    }

  }

  return ExecutionQueue;

})();

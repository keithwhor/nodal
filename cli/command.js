module.exports = (() => {

  'use strict';

  class Command {

    constructor(prefix, cmd, options, fn) {

      this._cmd = cmd;
      this._name = cmd.split(' ')[0];
      this._prefix = prefix;
      this._options = options || {};
      this._ext = (this._options.ext || []);
      this._ext.unshift(cmd.split(' ').splice(1).join(' '));
      this._def = this._options.definition || '';
      this._fn = fn;
      this._order = (this._name === 'help') ? -1 : Math.abs(this._options.order || 100);

    }

    index() {
      return ((this._prefix) ? (this._prefix + ':') : '') + this._name;
    }

    full() {
      return ((this._prefix) ? (this._prefix + ':') : '') + this._cmd;
    }

    ext(n) {
      return this._ext[n || 0];
    }

    extLength() {
      return this._ext.length;
    }

    isHidden() {
      return !!this._options.hidden;
    }

    getDefinition() {
      return this._def;
    }

    exec(args, flags, callback) {

      if (typeof this._fn !== 'function') {
        return callback(new Error('Method not implemented yet.'));
      }

      // Prevent throws (overhead is not important in CLI)
      try {
        this._fn(args, flags, callback);
      } catch(e) {
        callback(e);
      }

    }

  }

  return Command;

})();

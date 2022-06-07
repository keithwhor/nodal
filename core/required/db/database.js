'use strict';

const colors = require('colors/safe');

const DEFAULT_ADAPTER = 'postgres';
const ADAPTERS = {
  'postgres': './adapters/postgres.js',
};

class Database {

  constructor() {

    this.adapter = null;
    this._logsEnabled = false;
    this._useLogColor = 0;

  }

  connect(cfg) {

    if (typeof cfg === 'string') {
      cfg = {connectionString: cfg};
    }

    const Adapter = require(ADAPTERS[cfg.adapter] || ADAPTERS[DEFAULT_ADAPTER]);
    this.adapter = new Adapter(this, cfg);

    return true;

  }

  close(callback) {

    this.adapter.close.apply(this, arguments);
    callback && callback.call(this);
    return true;

  }

  enableLogs(enabled) {

    this._logsEnabled = !!enabled;

  }

  log(sql, params, time) {

    if (this._logsEnabled) {

      let colorFunc = this.__logColorFuncs[this._useLogColor];

      console.log();
      console.log(colorFunc(sql));
      params && console.log(colorFunc(JSON.stringify(params)));
      time && console.log(colorFunc(time + 'ms'));
      console.log();

      this._useLogColor = (this._useLogColor + 1) % this.__logColorFuncs.length;

    }

    return true;

  }

  info(message) {

    console.log(colors.green.bold('Database Info: ') + message);

  }

  error(message) {

    console.log(colors.red.bold('Database Error: ') + message);
    return true;

  }

  query() {

    this.adapter.query.apply(this.adapter, arguments);

  }

  transaction() {

    this.adapter.transaction.apply(this.adapter, arguments);

  }

  drop() {

    this.adapter.drop.apply(this.adapter, arguments);

  }

  create() {

    this.adapter.create.apply(this.adapter, arguments);

  }

}

Database.prototype.__logColorFuncs = [
  (str) => {
    return colors.yellow.bold(str);
  },
  (str) => {
    return colors.white(str);
  }
];

module.exports = Database;

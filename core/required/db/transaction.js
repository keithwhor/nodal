'use strict';

const async = require('async');

const TXN_STATUS = {
  READY: 0,
  COMPLETE: 1
};

/**
* The database transaction object (ORM)
* @class
*/
class Transaction {

  constructor(adapter, client, complete) {

    this.adapter = adapter;
    this._client = client;
    this._complete = complete;
    this._status = TXN_STATUS.READY;

  }

  __check__() {
    if (this._status === TXN_STATUS.COMPLETE) {
      throw new Error('Can not perform after transaction has completed');
    }
  }

  complete() {
    let complete = this._complete;
    this._status = TXN_STATUS.COMPLETE;
    complete();
  }

  query(sql, params, callback) {

    this.__check__();
    this.adapter.queryClient(this._client, sql, params, callback);

  }

  rollback(callback) {

    this.__check__();
    this.adapter.rollbackClient(this._client, err => {
      this.complete();
      callback(err);
    });

  }

  commit(callback) {

    this.__check__();
    this.adapter.commitClient(this._client, err => {
      this.complete();
      callback(err);
    });

  }

}

module.exports = Transaction;

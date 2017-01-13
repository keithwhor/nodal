'use strict';

/**
* The query composter transaction object (ORM)
* @class
*/
class Transaction {

  constructor() {

    this._compositions = [];
    this.db = null;

  }

  add(composer) {

    this.db = this.db || composer.db;
    if (this.db !== composer.db) {
      throw new Error('Can not create transaction across databases');
    }

    this._compositions.push(composer);

  }

  run() {

    let sql = this._compositions.map(c => {
      return c.__generateQuery__;
    });

  }

}

module.exports = Transaction;

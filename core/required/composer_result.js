'use strict';

module.exports = class ComposerResult {

  constructor(composerQuery, error, rows) {

    this.query = composerQuery;

    if(!error) {

      this.error = null;
      this.total = composerQuery._total;
      this.count = rows.length;
      this.offset = 0; //composerQuery._select.limit.offset;
      this.rows = rows;

    } else {

      this.error = error.message;
      this.total = 0;
      this.count = 0;
      this.offset = 0;
      this.rows = [];

    }

  }

};

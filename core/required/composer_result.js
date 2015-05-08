module.exports = (function() {

  function ComposerResult(composerQuery, error, rows) {

    this.query = composerQuery;

    if(!error) {

      this.error = null;
      this.total = composerQuery._total;
      this.count = rows.length;
      this.offset = 0; //composerQuery._select.limit.offset;
      this.rows = rows;

    } else {

      this.error = {'_query': error.message};
      this.total = 0;
      this.count = 0;
      this.offset = 0;
      this.rows = [];

    }

  }

  return ComposerResult;

})();

module.exports = (function() {

  function ComposerResult(composerQuery, error, result) {

    this.query = composerQuery;

    if(!error) {

      this.error = null;
      this.total = composerQuery._total;
      this.count = result.rows.length;
      this.offset = composerQuery._select.limit.offset;
      this.rows = result.rows.slice();

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

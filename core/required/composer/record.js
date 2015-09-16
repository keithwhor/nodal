module.exports = (function() {

  'use strict';

  class ComposerRecord {

    constructor(error, rows, resource, summary) {

      let offset =  0; // FIXME: Take real offset

      this.error = error || null;

      this.data = this.error ? [] : rows || [];
      
      this.resource = this.error ? null : typeof resource === 'object' ? resource : null;
      this.summary = this.error ? null : typeof summary === 'object' ? summary : null;

      this.offset = this.error ? 0 : Math.max(0, parseInt(offset) || 0);
      this.count = this.error ? 0 : this.data.length;
      this.total = this.error ? 0 : this.offset + this.data.length; // FIXME: Need real count

    }

  }

  return ComposerRecord;

})();

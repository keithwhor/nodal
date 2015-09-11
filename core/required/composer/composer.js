module.exports = (function() {

  'use strict';

  const Model = require('../model.js');
  const Database = require('../db/database.js');
  const ComposerResult = require('./composer_result.js');

  const ComposerRequest = require('./request.js');

  class Composer {

    from(db, modelConstructor) {

      if (!(db instanceof Database)) {
        throw new Error('Composer queries require valid database');
      }

      if (!Model.prototype.isPrototypeOf(modelConstructor.prototype)) {
        throw new Error('Composer queries require valid Model constructor');
      }

      return new ComposerRequest(db, modelConstructor);

    }

  };

  return Composer;

})();

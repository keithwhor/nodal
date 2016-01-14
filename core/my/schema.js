module.exports = (() => {

  'use strict';

  const env = require('./../env.js');
  const fs = require('fs');

  try {
    return JSON.parse(fs.readFileSync(env.rootDirectory + '/db/schema.json'));
  } catch(e) {
    return {migration_id: null};
  }

})();

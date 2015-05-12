'use strict';

const fs = require('fs');

module.exports = function(rootDirectory) {

  try {
    return JSON.parse(fs.readFileSync(rootDirectory + '/db/schema.json'));
  } catch(e) {
    return {migration_id: null};
  }

};

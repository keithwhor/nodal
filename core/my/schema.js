module.exports = Nodal => {

  'use strict';

  const fs = require('fs');

  try {
    return JSON.parse(fs.readFileSync(Nodal.rootDirectory + '/db/schema.json'));
  } catch(e) {
    return {migration_id: null};
  }

};

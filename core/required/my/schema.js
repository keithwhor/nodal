module.exports = (function(rootDirectory) {

  var fs = require('fs');

  try {
    return JSON.parse(fs.readFileSync(rootDirectory + '/db/schema.json'));
  } catch(e) {
    return {migration_id: null};
  }

});

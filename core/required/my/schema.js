module.exports = (function() {

  var fs = require('fs');

  try {
    return JSON.parse(fs.readFileSync(process.cwd() + '/db/schema.json'));
  } catch(e) {
    return {migration_id: null};
  }

})();

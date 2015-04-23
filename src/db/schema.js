module.exports = (function() {

  var fs = require('fs');

  return JSON.parse(fs.readFileSync('./schema.json'));

})();

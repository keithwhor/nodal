module.exports = (function() {

  const Nodal = require('nodal');
  const db = new Nodal.Database();

  db.connect(Nodal.my.Config.db.main);

  return db;

})();

'use strict';

const Nodal = require('nodal');
const db = new Nodal.Database();

db.connect(Nodal.my.Config.db.main);

module.exports = db;

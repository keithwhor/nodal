'use strict';

const env = require('./../env.js')();
const fs = require('fs');

let schema = {};

try {
  schema = JSON.parse(fs.readFileSync(env.rootDirectory + '/db/schema.json'));
} catch(e) {
  schema = {migration_id: null};
}

// If we don't have models (no migrations), set to empty object
schema.models = schema.models || {};

module.exports = schema;

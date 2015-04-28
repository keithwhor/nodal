module.exports = {
  model: require('./model.js').command,
  migration: require('./migration.js').command,
  controller: require('./controller.js').command
};

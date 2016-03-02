"use strict";

module.exports = {
  model: require('./model.js').command,
  migration: require('./migration.js').command,
  controller: require('./controller.js').command,
  middleware: require('./middleware.js').command,
  renderware: require('./renderware.js').command,
  task: require('./task.js').command
};

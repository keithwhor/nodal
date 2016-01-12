"use strict";

module.exports = {
  model: require('./model.js').command,
  migration: require('./migration.js').command,
  controller: require('./controller.js').command,
  initializer: require('./initializer.js').command,
  middleware: require('./middleware.js').command,
  task: require('./task.js').command
};

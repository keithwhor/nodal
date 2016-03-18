module.exports = (() => {

  'use strict';

  const Command = require('../command.js');
  const fs = require('fs');

  const Daemon = require('../../core/required/daemon.js');

  return new Command(
    null,
    'task <task name>',
    {definition: 'Run the named task', hidden: false, order: 3},
    (args, flags, callback) => {

      let taskName = args[0] && args[0][0] || '';
      let cwd = process.cwd();
      let taskPath = cwd + '/tasks/' + taskName + '.js';

      if (!fs.existsSync(taskPath)) callback(new Error('Task "' + taskName + '" does not exist'));

      const Task = require(taskPath);
      let task = new Task();

      task.exec(args.slice(1), (err) => {

        if (err) {
          console.log(`${colors.red.bold('Task Error:')} ${err.message}`);
        } else {
          console.log('Task complete!');
        }

        callback();

      });

    }
  );

})();

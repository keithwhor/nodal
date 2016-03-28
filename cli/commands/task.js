module.exports = (() => {

  'use strict';

  const Command = require('cmnd').Command;

  const fs = require('fs');
  const colors = require('colors/safe');

  class TaskCommand extends Command {

    constructor() {

      super('task');

    }

    help() {

      return {
        description: 'Runs the named task',
        args: ['task name']
      };

    }

    run(args, flags, vflags, callback) {

      let taskName = args[0] || '';
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

        callback(null);

      });

    }

  }

  return TaskCommand;

})();

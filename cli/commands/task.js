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

  run(params, callback) {

    let taskName = params.args[0] || '';
    let cwd = process.cwd();
    let taskPath = cwd + '/tasks/' + taskName + '.js';

    if (!fs.existsSync(taskPath)) callback(new Error('Task "' + taskName + '" does not exist'));

    const Task = require(taskPath);
    let task = new Task();

    task.exec(params.args.slice(1), (err, result) => {

      if (err) {
        console.log(`${colors.red.bold('Task Error:')} ${err.message}`);
      } else {
        console.log(colors.green.bold('Task complete!'));
      }

      callback(null, result || null);

    });

  }

}

module.exports = TaskCommand;

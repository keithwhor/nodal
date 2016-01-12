module.exports = function(Command) {
  'use strict';

  const fs = require('fs');

  new Command("task <task name>", { hidden: false, order: 3 }, (args, flags, callback) => {
    'use strict';

    let taskName = args[0] && args[0][0] || '';
    let cwd = process.cwd();
    let taskPath = cwd + '/tasks/' + taskName + '.js';

    if (!fs.existsSync(taskPath)) callback(new Error('Task "' + taskName + '" does not exist'));

    const Daemon = new require('../../core/required/daemon.js');
    let daemon = new Daemon('./app/app.js');

    daemon.start(function(app) {
      const Task = require(taskPath);
      let task = new Task();

      task.exec(app, args, function(err) {
        if (err) {
            console.log(`${colors.red.bold('Task Error:')} ${err.message}`);
        } else {
            console.log('Task complete!');
        }

        callback();

      });
    });
  }, "Run the named task");
};

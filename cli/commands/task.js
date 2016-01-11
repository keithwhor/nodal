module.exports = function(Command) {
  new Command("task", { hidden: true }, (args, flags, callback) => {
    "use strict";
    
    let taskName = args[0] && args[0][0] || '';
    let cwd = process.cwd();
    let taskPath = cwd + '/tasks/' + taskName + '.js';

    if (!fs.existsSync(taskPath)) callback(new Error('Task "' + taskName + '" does not exist'));

    const Daemon = new require('../core/required/daemon.js');
    let daemon = new Daemon('./app/app.js');

    daemon.start(function(app) {
      const Task = require(taskPath);
      let task = new Task();

      task.exec(app, function(err) {
        if (err) {
            console.log('Error executing task: ' + err.message);
        } else {
            console.log('Task complete!');
        }

        callback();

      });
    });
  }, "");
};
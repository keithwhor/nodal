module.exports = function(Command) {
  'use strict';

  new Command("s", { order: 2 }, (args, flags, callback) => {
    "use strict";
    let Nodal = require('../../core/module.js');
    let spawn = require('cross-spawn-async');
    let child = spawn('npm',  ['start'], {stdio: 'inherit'});

    process.on('exit', function() {
      child && child.kill();
    });
  }, "Start the Nodal server based on the current project");
};

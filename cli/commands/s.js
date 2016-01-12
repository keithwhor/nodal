module.exports = (() => {

  'use strict';

  const Command = require('../command.js');

  return new Command(
    null,
    's',
    {order: 2},
    (args, flags, callback) => {

      let spawn = require('cross-spawn-async');
      let child = spawn('npm',  ['start'], {stdio: 'inherit'});

      process.on('exit', function() {
        child && child.kill();
      });

  });

})();

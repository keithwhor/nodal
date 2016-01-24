module.exports = (() => {

  'use strict';

  const Command = require('../command.js');
  const colors = require('colors/safe');

  return new Command(
    null,
    'version',
    {definition: 'Show Nodal version', hidden: false, order: 2},
    (args, flags, callback) => {

      let version = require('../../package.json').version;

      console.log(colors.green.bold('Nodal Version: ') + version);

      callback(null);

  });

})();

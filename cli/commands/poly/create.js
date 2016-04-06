module.exports = (() => {

  'use strict';

  const Command = require('cmnd').Command;
  const APIResource = require('api-res');
  const Credentials = require('../../credentials.js');

  const async = require('async');

  class PolyCreateCommand extends Command {

    constructor() {

      super('poly', 'create');

    }

    help() {

      return {
        description: 'Creates a new, empty project',
        args: ['project']
      };

    }

    run(args, flags, vflags, callback) {

      let data = {};
      data.name = args[0];

      console.log(`Creating project "${data.name}"...`);

      let host = flags.h ? flags.h[0] : 'https://api.polybit.com';
      let port = flags.p && flags.p[0];

      let resource = new APIResource(host, port);
      resource.authorize(Credentials.read('ACCESS_TOKEN'));

      resource.request('/v1/projects').create({}, data, (err, response) => {

        if (err) {
          return callback(err);
        }

        console.log('Project created successfully!');
        return callback(null, response.data[0]);

      });

    }

  }

  return PolyCreateCommand;

})();

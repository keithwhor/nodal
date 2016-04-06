module.exports = (() => {

  'use strict';

  const Command = require('cmnd').Command;
  const APIResource = require('api-res');
  const Credentials = require('../../credentials.js');

  const async = require('async');

  class PolyRemoveCommand extends Command {

    constructor() {

      super('poly', 'remove');

    }

    help() {

      return {
        description: 'Removes a project',
        args: ['project']
      };

    }

    run(args, flags, vflags, callback) {

      let data = {};
      data.name = args[0];

      console.log(`Destroying project ${data.name}...`);

      let host = flags.h ? flags.h[0] : 'https://api.polybit.com';
      let port = flags.p && flags.p[0];

      let resource = new APIResource(host, port);
      resource.authorize(Credentials.read('ACCESS_TOKEN'));

      resource.request('v1/projects').index({name: data.name}, (err, response) => {

        if (err) {
          return callback(err);
        }

        if (!response.data.length) {
          return callback(new Error(`Could not find project with name ${data.name}`));
        }

        let id = response.data[0].id;

        resource.request('v1/projects').destroy(id, {}, (err, response) => {

          if (err) {
            return callback(err);
          }

          return callback(null, `Destroyed project ${response.data[0].name} successfully`);

        });

      });

    }

  }

  return PolyRemoveCommand;

})();

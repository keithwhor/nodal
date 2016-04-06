module.exports = (() => {

  'use strict';

  const Command = require('cmnd').Command;
  const APIResource = require('api-res');
  const Credentials = require('../../../credentials.js');

  const async = require('async');

  class PolyDBDropCommand extends Command {

    constructor() {

      super('poly', 'db', 'drop');

    }

    help() {

      return {
        description: 'Destroys a database',
        args: ['db']
      };

    }

    run(args, flags, vflags, callback) {

      let data = {};
      data.name = args[0];

      console.log(`Destroying database ${data.name}...`);

      let host = flags.h ? flags.h[0] : 'https://api.polybit.com';
      let port = flags.p && flags.p[0];

      let resource = new APIResource(host, port);
      resource.authorize(Credentials.read('ACCESS_TOKEN'));

      resource.request('v1/databases').index({name: data.name}, (err, response) => {

        if (err) {
          return callback(err);
        }

        if (!response.data.length) {
          return callback(new Error(`Could not find database with name ${data.name}`));
        }

        let id = response.data[0].id;

        resource.request('v1/databases').destroy(id, {}, (err, response) => {

          if (err) {
            return callback(err);
          }

          return callback(null, `Dropped database "${response.data[0].name}" successfully`);

        });

      });

    }

  }

  return PolyDBDropCommand;

})();

'use strict';

const Command = require('cmnd').Command;
const APIResource = require('api-res');
const tabler = require('../../../tabler.js');
const Credentials = require('../../../credentials.js');

const async = require('async');

class PolyDBListCommand extends Command {

  constructor() {

    super('poly', 'db', 'list');

  }

  help() {

    return {
      description: 'Retrieves a list of all available Polybit databases for current user'
    };

  }

  run(args, flags, vflags) {

    let name = params.args[0];

    let host = params.flags.h ? params.flags.h[0] : 'https://api.polybit.com';
    let port = params.flags.p && params.flags.p[0];

    let resource = new APIResource(host, port);
    resource.authorize(Credentials.read('ACCESS_TOKEN'));

    async.parallel([
      (callback) => {

        resource.request('v1/databases').index({}, (err, response) => {

          if (err) {
            return callback(`Error: ${err.message}`);
          }

          if (response.data.length < 1) {
            return callback(`No databases available.`);
          }

          let dbs = response.data;

          callback(null, dbs);

        })

      }
    ], (err, results) => {

      if (err) {
        return console.error(err);
      }

      let dbs = results[0];

      console.log('Current databases:');
      console.log(tabler(['name', 'created_at'], dbs));

    });

  }

}

module.exports = PolyDBListCommand;

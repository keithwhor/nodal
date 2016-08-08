'use strict';

const Command = require('cmnd').Command;
const APIResource = require('api-res');
const tabler = require('../../tabler.js');
const Credentials = require('../../credentials.js');

const async = require('async');

class PolyListCommand extends Command {

  constructor() {

    super('poly', 'list');

  }

  help() {

    return {
      description: 'Retrieves a list of all available Polybit projects for current user'
    };

  }

  run(args, flags, vflags) {

    let host = params.flags.h ? params.flags.h[0] : 'https://api.polybit.com';
    let port = params.flags.p && params.flags.p[0];

    let resource = new APIResource(host, port);
    resource.authorize(Credentials.read('ACCESS_TOKEN'));

    async.parallel([
      (callback) => {

        resource.request('v1/projects').index({}, (err, response) => {

          if (err) {
            return callback(`Error: ${err.message}`);
          }

          if (response.data.length < 1) {
            return callback(`No projects available.`);
          }

          let projects = response.data;

          callback(null, projects);

        })

      }
    ], (err, results) => {

      if (err) {
        return console.error(err);
      }

      let projects = results[0];

      console.log('Available projects:');
      console.log(tabler(['name', 'service_type', 'created_at'], projects));

    });

  }

}

module.exports = PolyListCommand;

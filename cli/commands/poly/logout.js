'use strict';

const Command = require('cmnd').Command;
const APIResource = require('api-res');
const Credentials = require('../../credentials.js');

const async = require('async');

class PolyLogoutCommand extends Command {

  constructor() {

    super('poly', 'logout');

  }

  help() {

    return {
      description: 'Logs out of Polybit API server'
    };

  }

  run(params, callback) {

    let host = params.flags.h ? params.flags.h[0] : 'https://api.polybit.com';
    let port = params.flags.p && params.flags.p[0];

    let resource = new APIResource(host, port);
    resource.authorize(Credentials.read('ACCESS_TOKEN'));

    resource.request('v1/access_tokens').destroy(null, {}, (err, response) => {

      if (err) {
        return callback(err);
      }

      Credentials.write('ACCESS_TOKEN', '');
      return callback(null, 'Logged out successfully');

    });

  }

}

module.exports = PolyLogoutCommand;

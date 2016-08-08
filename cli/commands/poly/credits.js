'use strict';

const Command = require('cmnd').Command;
const APIResource = require('api-res');
const Credentials = require('../../credentials.js');
const colors = require('colors/safe');

const async = require('async');

class PolyCreditsCommand extends Command {

  constructor() {

    super('poly', 'credits');

  }

  help() {

    return {
      description: 'Shows you your current Polybit Credit balance'
    };

  }

  run(params, callback) {

    let host = params.flags.h ? params.flags.h[0] : 'https://api.polybit.com';
    let port = params.flags.p && params.flags.p[0];

    let resource = new APIResource(host, port);
    resource.authorize(Credentials.read('ACCESS_TOKEN'));

    async.parallel([
      (callback) => {

        resource.request('v1/users').index({me: true}, (err, response) => {

          if (err) {
            return callback(`Error: ${err.message}`);
          }

          if (response.data.length < 1) {
            return callback(`You are not currently logged in to Polybit.`);
          }

          let user = response.data[0];

          callback(null, user);

        })

      }
    ], (err, results) => {

      if (err) {
        return console.error(err);
      }

      let user = results[0];

      console.log(`You have ${colors.bold.green(user.credits | 0)} Polybit Credits available.`);
      callback();

    });

  }

}

module.exports = PolyCreditsCommand;

module.exports = (() => {

  'use strict';

  const Command = require('cmnd').Command;
  const APIResource = require('api-res');
  const Credentials = require('../../credentials.js');

  const async = require('async');

  class PolyEnvCommand extends Command {

    constructor() {

      super('poly', 'env');

    }

    help() {

      return {
        description: 'Retrieves, sets or removes environment variables for a project',
        args: ['project'],
        flags: {
          s: '[key] [value] Sets an environment variable',
          r: '[key] Removes an environment variable'
        },
        vflags: {
          set: '[key] [value] Sets an environment variable',
          remove: '[key] Removes an environment variable'
        }
      };

    }

    run(args, flags, vflags, callback) {

      let name = args[0];
      let set = flags.s || vflags.set;
      let remove = flags.r || vflags.remove;

      let host = flags.h ? flags.h[0] : 'https://api.polybit.com';
      let port = flags.p && flags.p[0];

      let resource = new APIResource(host, port);
      resource.authorize(Credentials.read('ACCESS_TOKEN'));

      async.parallel([
        (cb) => {

          resource.request('v1/projects').index({name: name}, (err, response) => {

            if (err) {
              return cb(err);
            }

            if (response.data.length < 1) {
              return cb(new Error(`Project with name "${name}" does not exist.`));
            }

            let project = response.data[0];

            cb(null, project);

          })

        }
      ], (err, results) => {

        if (err) {
          return callback(err);
        }

        let project = results[0];

        let env = (project.env || '').split('\n').filter(v => v);

        if (remove) {
          env = env.filter(v => v && v.indexOf(remove[0] + '=') !== 0);
        }

        if (set) {
          env = env.filter(v => v && v.indexOf(set[0] + '=') !== 0);
          env.push(`${set[0]}=${set[1]}`);
        }

        env.push('');

        resource.request('v1/projects').update(project.id, {}, {env: env.join('\n')}, (err, response) => {

          if (err) {
            return console.error('Error setting environment vars');
          }

          let project = response.data[0];

          console.log(`Environment variables for ${project.name}:`);
          console.log(project.env);

        });

      });

    }

  }

  return PolyEnvCommand;

})();

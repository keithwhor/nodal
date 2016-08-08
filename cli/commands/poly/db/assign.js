'use strict';

const Command = require('cmnd').Command;
const APIResource = require('api-res');
const Credentials = require('../../../credentials.js');

const async = require('async');

class PolyDBAssignCommand extends Command {

  constructor() {

    super('poly', 'db', 'assign');

  }

  help() {

    return {
      description: 'Assigns a database to a project',
      args: ['database', 'project']
    };

  }

  run(params, callback) {

    let data = {};
    data.alias = params.args[0] || '';
    data.project = params.args[1] || '';

    console.log(`Assigning database "${data.alias}" to "${data.project}"...`);

    let host = params.flags.h ? params.flags.h[0] : 'https://api.polybit.com';
    let port = params.flags.p && params.flags.p[0];

    let resource = new APIResource(host, port);
    resource.authorize(Credentials.read('ACCESS_TOKEN'));

    async.parallel([
      (cb) => {

        resource.request('v1/databases').index({alias: data.alias}, (err, response) => {

          if (err) {
            return cb(err);
          }

          if (response.data.length < 1) {
            return cb(new Error(`Could not assign database: Database with alias "${data.alias}" does not exist.`));
          }

          let userDb = response.data[0];
          cb(null, userDb);

        })
      },
      (cb) => {

        resource.request('v1/projects').index({name: data.project}, (err, response) => {

          if (err) {
            return cb(err);
          }

          if (response.data.length < 1) {
            return cb(new Error(`Could not assign database: Project with name "${data.project}" does not exist.`));
          }

          let project = response.data[0];

          cb(null, project);

        })

      }
    ], (err, results) => {

      if (err) {
        return callback(err);
      }

      let db = results[0];
      let project = results[1];

      let env = (project.env || '').split('\n').filter(v => v && v.indexOf('DATABASE_URL=') !== 0);
      env.push(`DATABASE_URL=${db.url}`);
      env.push('');

      resource.request('v1/projects').update(project.id, {}, {env: env.join('\n')}, (err, response) => {

        if (err) {
          return callback(new Error('Could not assign database: Error setting environment vars'));
        }

        console.log(`Environment variable DATABASE_URL set for project "${project.name}" to database "${db.alias}"`);
        return callback(null, response.data[0]);

      });

    });

  }

}

module.exports = PolyDBAssignCommand;

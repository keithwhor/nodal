'use strict';

const Command = require('cmnd').Command;
const APIResource = require('api-res');
const Credentials = require('../../credentials.js');

const async = require('async');

class PolyRunCommand extends Command {

  constructor() {

    super('poly', 'run');

  }

  help() {

    return {
      description: 'Runs a Nodal command on your deployed project',
      args: ['project']
    };

  }

  run(params, callback) {

    let name = params.args[0];
    let command = params.args[1];

    let host = params.flags.h ? params.flags.h[0] : 'https://api.polybit.com';
    let port = params.flags.p && params.flags.p[0];

    let resource = new APIResource(host, port);
    resource.authorize(Credentials.read('ACCESS_TOKEN'));

    async.parallel([
      (cb) => {

        resource.request('v1/projects').index({name: name}, (err, response) => {

          if (err) {
            return cb(err);
          }

          if (response.data.length < 1) {
            return cb(new Error(`Could not run command: Project "${name}" does not exist.`));
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

      console.log(`Running "${command}..."`);

      resource.request('v1/projects').update(project.id, {action: 'command', command: command}, null, (err, response) => {

        if (err) {
          callback(new Error(`Could not run command: ${err.message}`));
        }

        console.log(`Ran "${command}" successfully!`);
        callback(null, response.data[0]);

      });

    });

  }

  list(files, filename) {

    let path = process.cwd() + '/' + filename;

    if (!fs.existsSync(path)) {
      return;
    }

    let stat = fs.statSync(path);

    if (stat.isDirectory()) {
      return fs
        .readdirSync(path)
        .map(v => `${filename}/${v}`)
        .reduce(this.list.bind(this), files);
    }

    files.push(filename);
    return files;

  }

}

module.exports = PolyRunCommand;

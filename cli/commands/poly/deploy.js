'use strict';

const Command = require('cmnd').Command;
const APIResource = require('api-res');
const Credentials = require('../../credentials.js');
const PolyCreditsCommand = require('./credits.js');

const fs = require('fs');
const zlib = require('zlib');
const async = require('async');
const path = require('path');

class PolyDeployCommand extends Command {

  constructor() {

    super('poly', 'deploy');

  }

  help() {

    return {
      description: 'Deploys current directory as a Nodal project',
      args: ['project']
    };

  }

  run(params, callback) {

    if (!fs.existsSync(path.join(process.cwd(), '.nodal'))) {
      return callback(new Error('Must run `nodal poly:deploy` or `nodal poly:compile` from a valid Nodal project.'));
    }

    let name = params.args[0];

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
            return cb(new Error(`Could not deploy: Project "${name}" does not exist.`));
          }

          let project = response.data[0];

          cb(null, project);

        })

      }
    ], (err, results) => {

      if (err) {
        return callback(err);
      }

      console.log('Compiling...');

      let project = results[0];

      let files = [
        'app',
        'config',
        'db',
        'middleware',
        'node_modules',
        'renderware'
      ].reduce(this.list.bind(this), []).map(filename => {

        return (cb) => {
          return fs.readFile(filename, (err, result) => {
            return cb(err, {filename: filename, data: result.toString('base64')});
          });
        };

      });

      async.parallel(files, (err, result) => {

        let buffer = new Buffer(JSON.stringify(result));

        zlib.deflate(buffer, (err, compressed) => {

          if (err) {
            console.error(`Could not deploy: ${err.message}`);
            return callback(err);
          }

          console.log(`Package size: ${compressed.length} (${(compressed.length / (1024 * 1024)).toFixed(2)} MB)`);
          console.log('Deploying...');

          let finish = (() => {
            let t = new Date().valueOf();
            let length = 50;
            let barSize = 10;
            let emptyChar = '-';
            let barChar = '=';
            let i = 0;
            let progress = setInterval(() => {
              process.stdout.write(`\r[${emptyChar.repeat(i % length)}${barChar.repeat(barSize)}${emptyChar.repeat(length - (i % length) - 1)}]`);
              i++;
            }, 50);
            return () => {
              clearInterval(progress);
              process.stdout.write(`\rDeployed in ${((new Date().valueOf() - t) / 1000) | 0} seconds!${' '.repeat(length)}\n`);
            };
          })();


          resource.request('v1/projects').update(project.id, {action: 'deploy'}, compressed, (err, response) => {

            finish();

            if (err) {
              console.error(`Could not deploy: ${err.message}`);
              return callback(err);
            }

            console.log('Deployment complete!');

            PolyCreditsCommand.prototype.run({args: [], flags: params.flags, vflags: params.vflags}, () => {

              return callback(null, response.data[0]);

            });

          });

        });

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

module.exports = PolyDeployCommand;

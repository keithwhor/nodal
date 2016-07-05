'use strict';

const Command = require('cmnd').Command;
const APIResource = require('api-res');
const Credentials = require('../../../credentials.js');
const PolyCreditsCommand = require('../credits.js');

const path = require('path');
const fs = require('fs');

const async = require('async');

class PolyDBCreateCommand extends Command {

  constructor() {

    super('poly', 'db', 'create');

  }

  help() {

    return {
      description: 'Creates a new database',
      args: ['name'],
      vflags: {
        development: 'Sets your development environment database to this db',
        test: 'Sets your test environment database to this db',
      }
    };

  }

  run(args, flags, vflags, callback) {

    let data = {};
    data.alias = args[0];

    console.log(`Creating new database with alias "${data.alias}"...`);

    let host = flags.h ? flags.h[0] : 'https://api.polybit.com';
    let port = flags.p && flags.p[0];

    let resource = new APIResource(host, port);
    resource.authorize(Credentials.read('ACCESS_TOKEN'));

    resource.request('v1/databases').create({}, data, (err, response) => {

      if (err) {
        return callback(err);
      }

      console.log('Database created successfully!');

      PolyCreditsCommand.prototype.run([], flags, vflags, () => {

        let cfgPath = path.join(process.cwd(), 'config', 'db.json');
        let db = require(cfgPath);

        if (vflags.development) {

          db.development.main = {connectionString: response.data[0].url};
          fs.writeFileSync(cfgPath, JSON.stringify(db, null, 2));

        } else if (vflags.test) {

          db.test.main = {connectionString: response.data[0].url};
          fs.writeFileSync(cfgPath, JSON.stringify(db, null, 2));

        }

        return callback(null, response.data[0]);

      });

    });

  }

}

module.exports = PolyDBCreateCommand;

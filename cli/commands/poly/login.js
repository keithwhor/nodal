module.exports = (() => {

  'use strict';

  const Command = require('cmnd').Command;
  const APIResource = require('api-res');
  const Credentials = require('../../credentials.js');

  const inquirer = require('inquirer');
  const async = require('async');

  class PolyLoginCommand extends Command {

    constructor() {

      super('poly', 'login');

    }

    help() {

      return {
        description: 'Logs in to Polybit API server'
      };

    }

    run(args, flags, vflags, callback) {

      let host = flags.h ? flags.h[0] : 'https://api.polybit.com';
      let port = flags.p && flags.p[0];

      let email = vflags.email && vflags.email[0];
      let password = vflags.password && vflags.password[0];

      let questions = [];

      email || questions.push({
        name: 'email',
        type: 'input',
        default: '',
        message: 'e-mail',
      });

      password || questions.push({
        name: 'password',
        type: 'password',
        message: 'password',
      });

      inquirer.prompt(questions, (promptResult) => {

        email = email || promptResult.email;
        password = password || promptResult.password;

        let resource = new APIResource(host, port);

        resource.request('v1/access_tokens').create({}, {grant_type: 'password', username: email, password: password}, (err, response) => {

          if (err) {
            return callback(err);
          }

          Credentials.write('ACCESS_TOKEN', response.data[0].access_token);
          return callback(null, 'Logged in successfully');

        });

      });

    }

  }

  return PolyLoginCommand;

})();

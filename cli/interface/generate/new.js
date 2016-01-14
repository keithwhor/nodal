module.exports = (function() {
  'use strict';

  const fs = require('fs');
  const fs_extra = require('fs-extra');
  const path = require('path');
  const inquirer = require('inquirer');
  const inflect = require('i')();
  const colors = require('colors/safe');

  return {
    new: function(args, flags, callback) {
      const rootPath = path.resolve(__dirname);

      console.log('');
      console.log(`Welcome to ${colors.bold.green('Nodal!')}`);
      console.log('');
      console.log('Let\'s get some information about your project...');
      console.log('');

      var questions = [
        {
          name: 'name',
          type: 'input',
          default: 'my-nodal-project',
          message: 'Name',
        },
        {
          name: 'author',
          type: 'input',
          default: 'mysterious author',
          message: 'Author',
        },
        {
          name: 'heroku',
          type: 'confirm',
          default: false,
          message: 'heroku support?',
        },
        {
          name: 'database',
          type: 'confirm',
          default: false,
          message: 'Database support?',
        },
        {
          name: 'databaseName',
          type: 'input',
          default: (answers) => inflect.underscore(answers.name),
          message: 'Database name',
          when: (answers) => answers.database
        },
      ];

      inquirer.prompt(questions, (promptResult) => {

        promptResult.simpleName = promptResult.name.replace(/\s/gi, '-');

        promptResult.databaseName = inflect.underscore(promptResult.simpleName);
        if ( promptResult.databaseName) {
          promptResult.databaseName = inflect.underscore(promptResult.databaseName);
        }

        let dirname = promptResult.name.replace(/[^A-Za-z0-9-_]/gi, '-').toLowerCase();

        console.log('');
        console.log('Creating directory "' + dirname + '"...');
        console.log('');

        if (fs.existsSync('./' + dirname)) {
          callback(new Error('Directory "' + dirname + '" already exists, try a different project name'));
        }
        fs.mkdirSync('./' + dirname);

        console.log('Copying Nodal directory structure and files...');
        console.log('');

        fs_extra.copy(rootPath + '/../../../src', './' + dirname, function(err) {

          if (err) return callback(err);

          let dot = require('dot');

          dot.templateSettings.strip = false;
          dot.templateSettings.varname = 'data';

          fs.writeFileSync('./' + dirname + '/package.json', dot.template(
            fs.readFileSync(rootPath + '/templates/package.json.jst').toString()
          )(promptResult));

          if (promptResult.heroku) {
            fs.writeFileSync('./' + dirname + '/app.json', dot.template(
              fs.readFileSync(rootPath + '/templates/app.json.jst').toString()
            )(promptResult));
          }

          fs.writeFileSync('./' + dirname + '/app/controllers/index_controller.js', dot.template(
            fs.readFileSync(rootPath + '/templates/index_controller.jst').toString()
          )(promptResult));

          fs.writeFileSync('./' + dirname + '/README.md', dot.template(
            fs.readFileSync(rootPath + '/templates/README.md.jst').toString()
          )(promptResult));

          // read in the dbjson template, replace the development database name
          // generate new config/db.json in the generated app
          // NOTE: The db.json is intentionally not conditionally wrapped based
          // on DB support since if users want to enable it later, worse case it
          // defaults to an underscored version  <appname>_development
          let dbjson = JSON.parse(fs.readFileSync(rootPath + '/templates/db.json'));
          dbjson.development.main.database = promptResult.databaseName + '_development';
          dbjson.test.main.database = promptResult.databaseName + '_test';
          fs.writeFileSync('./' + dirname + '/config/db.json', JSON.stringify(dbjson, null, 4));

          // Lets enable database support by default if the user said yes to the prompt
          // NOTE: I didnt see the need to templatize this since it was quicker to re-write
          //       the copied in file
          if (promptResult.database) {
            const appFile = './' + dirname + '/app/app.js';
            let contents = fs.readFileSync(appFile).toString()
            fs.writeFileSync(appFile, contents.replace(/\/\/ /g, ''));
          }

          let spawn = require('cross-spawn-async');

          let child = spawn('npm', ['cache', 'clean'], {
            cwd: process.cwd() + '/' + dirname,
            stdio: 'inherit'
          });

          child.on('exit', function() {

            let child = spawn('npm', ['install'], {
              cwd: process.cwd() + '/' + dirname,
              stdio: 'inherit'
            });

            console.log('Installing packages in this directory...');
            console.log('');

            child.on('exit', function() {
              console.log('');
              console.log(colors.bold.green('All done!'));
              console.log('');
              console.log('Your new Nodal project, ' + colors.bold(promptResult.name) + ', is ready to go! :)');
              console.log('');
              console.log('Have fun ' + promptResult.author + ', and check out https://github.com/keithwhor/nodal for the most up-to-date Nodal information')
              console.log('');
              console.log(colors.bold('Pro tip: ') + 'You can try running your server right away with:');
              console.log('');
              console.log('  cd ' + dirname + ' && nodal s');
              console.log('');
              callback();
            });

            process.on('exit', function() {
              child && child.kill();
            });

          });

        });

      });
    }
  };

})();

const fs = require('fs');
const fs_extra = require('fs-extra');
const path = require('path');
const prompt = require('prompt');
const inflect = require('i')();
const colors = require('colors/safe');

prompt.message = '';
prompt.delimiter = '';

module.exports = function(Command) {
  new Command("new", null, (args, flags, callback) => {
    "use strict";
    
    const rootPath = path.resolve(__dirname, '../');
    
    console.log('');
    console.log('Welcome to Nodal!');
    console.log('');
    console.log('Let\'s get some information about your project...');
    console.log('');

    var schema = {
      properties: {
        name: {
          default: 'my-nodal-project'
        },
        author: {
          default: 'mysterious author'
        },
        heroku: {
          message: 'heroku support?',
          validator: /y[es]*|n[o]?/,
          warning: 'Must respond yes or no',
          default: 'no',
          before: (value) => value === 'yes'
        }
      }
    };

    prompt.get(schema, function(err, promptResult) {

      if (err) {
        callback(error);
      }

      promptResult.simpleName = promptResult.name.replace(/\s/gi, '-');
      promptResult.databaseName = inflect.underscore(promptResult.name);
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

      fs_extra.copy(rootPath + '../../src', './' + dirname, function(err) {

        if (err) return callback(err);

        let dot = require('dot');

        dot.templateSettings.strip = false;
        dot.templateSettings.varname = 'data';

        fs.writeFileSync('./' + dirname + '/package.json', dot.template(
          fs.readFileSync(rootPath + '/package.json.jst').toString()
        )(promptResult));

        if (promptResult.heroku) {
          fs.writeFileSync('./' + dirname + '/app.json', dot.template(
            fs.readFileSync(rootPath + '/app.json.jst').toString()
          )(promptResult));
        }

        fs.writeFileSync('./' + dirname + '/app/controllers/index_controller.js', dot.template(
          fs.readFileSync(rootPath + '/index_controller.jst').toString()
        )(promptResult));

        fs.writeFileSync('./' + dirname + '/README.md', dot.template(
          fs.readFileSync(rootPath + '/README.md.jst').toString()
        )(promptResult));

        // read in the dbjson template, replace the development database name
        // generate new config/db.json in the generated app
        let dbjson = JSON.parse(fs.readFileSync(rootPath + '/templates/db.json'));
        dbjson.development.main.database = promptResult.databaseName + '_development';
        fs.writeFileSync('./' + dirname + '/config/db.json', JSON.stringify(dbjson, null, 4));

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
  }, "Initialize the current directory as a new Nodal project");
};
module.exports = (function() {

    'use strict';

    const Nodal = require('nodal');
    const fs = require('fs');
    const async = require('async');
    const inflect = require('i')();

    class GenerateSeedTask {

      exec(app, args, callback) {

        let seed = {};

        let tasks = Object.keys(Nodal.my.Schema.models).map((model) = > {

          return (callback) = > {
            let seedKey = inflect.underscore(inflect.classify(model));
            let modelObject = Nodal.require(`./app/models/${seedKey}.js`);

            modelObject.query().where({}).end((err, models) = > {
              seed[model] = models.toObject();
              callback();
            });

          };

        })

        async.series(tasks, (err) = > {
          fs.writeFileSync('./db/seed.json', JSON.stringify(seed));
          console.log('GenerateSeed task executed');
          callback();
        });

      }
    }

    return GenerateSeedTask;

})();

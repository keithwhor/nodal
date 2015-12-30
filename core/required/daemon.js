module.exports = (function() {

  'use strict';

  const Application = require('./application.js');
  const dummyRouter = require('./dummy_router.js');

  const fs = require('fs');

  /**
  * Daemon for running servers. Restarts when changes are made to the underlying file structure.
  * @class
  */
  class Daemon {

    /**
    * @param {string} path Path to your app.js file which exports your Application
    */
    constructor(path) {

      this._path = path;
      this._watchers = null;

      this._onStart = function() {};

    }

    /**
    * Begins the Daemon, instantiates your app. Initializers called first. Will only watch for changes when NODE_ENV is empty or set to "development"
    * @param {function} callback Method to execute when Application is finished initializing.
    */
    start(callback) {

      callback = typeof callback === 'function' ? callback : this._onStart;
      this._onStart = callback;

      let self = this;
      let init = function() {

        if ((process.env.NODE_ENV || 'development') === 'development') {
          self.watch('', self.restart.bind(self));
        }

        callback.call(self, this);

      };

      try {

        let App = require(process.cwd() + '/' + this._path);

        if (!(Application.prototype.isPrototypeOf(App.prototype))) {
          throw new Error('Daemon requires valid Nodal.Application');
        }

        App.prototype.__initialize__ = init;
        this._app = new App();

        let listener = (function(err) {

          if (!(err instanceof Error)) {
            err = new Error(err);
          }

          console.error('Caught exception: ' + err.message);
          console.error(err.stack);

          process.removeListener('uncaughtException', listener);
          this.restart(err);

        }).bind(this);

        process.on('uncaughtException', listener);

      } catch(err) {

        this.startError(err, init);

      }

    }

    /**
    * Begins the Daemon in error mode (will show the startup error).
    * @param {Error} error The error the application encountered when it tried to start.
    * @param {function} init The initialization function from Daemon#start
    */
    startError(error, init) {

      class DummyApp extends Application {

        __setup__() {

          this.useRouter(dummyRouter(error));

        }

      }

      DummyApp.prototype.__initialize__ = init;
      this._app = new DummyApp();

    }

    /**
    * Restarts the Daemon
    */
    restart(err) {

      this.stop(err, this.start);

    }

    /**
    * Stops the Daemon
    * @param {function} onStop Method to execute when Daemon has stopped successfully
    */
    stop(err, onStop) {

      this.unwatch();

      err = err || new Error('Application Stopped');

      let cwd = process.cwd();

      Object.keys(require.cache).filter(function(v) {
        return v.indexOf(cwd) === 0 &&
          v.substr(cwd.length).indexOf('/node_modules/') !== 0;
      }).forEach(function(key) {
        delete require.cache[key];
      });

      this._app.__destroy__(err, onStop.bind(this));

    }

    /**
    * Stops watching directory tree for changes to files
    */
    unwatch() {

      this._watchers && clearInterval(this._watchers.interval);
      this._watchers = null;

    }

    /**
    * Watches a directory tree for changes
    * @param {string} path Directory tree to watch
    * @param {function} onChange Method to be executed when a change is detected
    */
    watch(path, onChange) {

      function watchDir(cwd, dirname, watchers) {

        if (!watchers) {

          watchers = Object.create(null);
          watchers.directories = Object.create(null);
          watchers.interval = null;

        }

        let path = [cwd, dirname].join('');
        let files = fs.readdirSync(path);

        watchers.directories[path] = Object.create(null);

        files.forEach(function(v) {

          if (v === 'node_modules' || v.indexOf('.git') === 0) {
            return;
          }

          let filename = [dirname, v].join('/');
          let fullPath = [cwd, filename].join('/');

          let stat = fs.statSync(fullPath);

          if (stat.isDirectory()) {
            watchDir(cwd, filename, watchers);
            return;
          }

          watchers.directories[path][v] = stat;

        });

        return watchers;

      }

      let watchers = watchDir(process.cwd(), path || '');
      let self = this;

      watchers.iterate = function(changes) {

        changes.forEach(function(v) {
          console.log(v.event[0].toUpperCase() + v.event.substr(1) + ': ' + v.path);
        });

        if (changes.length) {
          watchers.interval && clearInterval(watchers.interval);
          onChange.call(self);
        }

      };

      watchers.interval = setInterval(function() {

        /* let t = new Date().valueOf();

        console.log('Checking project tree...'); */

        let changes = [];

        Object.keys(watchers.directories).forEach(function(dirPath) {

          let dir = watchers.directories[dirPath];
          let files = fs.readdirSync(dirPath);
          let added = [];

          let contents = Object.create(null);

          files.forEach(function(v) {

            if (v === 'node_modules' || v.indexOf('.git') === 0) {
              return;
            }

            let fullPath = [dirPath, v].join('/');
            let stat = fs.statSync(fullPath);

            if (stat.isDirectory()) {
              return;
            }

            if (!dir[v]) {
              added.push([v, stat]);
              changes.push({event: 'added', path: fullPath});
              return;
            }

            if (stat.mtime.toString() !== dir[v].mtime.toString()) {
              dir[v] = stat;
              changes.push({event: 'modified', path: fullPath});
            }

            contents[v] = true;

          });

          Object.keys(dir).forEach(function(v) {

            let fullPath = [dirPath, v].join('/');

            if (!contents[v]) {
              delete dir[v];
              changes.push({event: 'removed', path: fullPath});
            }

          });

          added.forEach(function(v) {
            dir[v[0]] = v[1];
          });

        });

        watchers.iterate(changes);

        /* t = (new Date).valueOf() - t;

        console.log('Project tree walked. Took ' + t + 'ms'); */

      }, 1000);

      return this._watchers = watchers;

    }

  }

  return Daemon;

})();

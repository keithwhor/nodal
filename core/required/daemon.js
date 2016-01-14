module.exports = (function() {

  'use strict';

  const Application = require('./application.js');
  const dummyRouter = require('./dummy_router.js');

  const fs = require('fs');
  const cluster = require('cluster');
  const coreCount = require('os').cpus().length;
  const WIDstatic = 0;

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
      this._workers = new Map();
      // Keep instances from colliding WIDs
      this._WIDcounter = WIDstatic;

      this._onStart = function() {};

    }
    
    /**
    * Creates a new Application fork on a child process
    * @param {function} callback Method to execute when the forked Application on the Worker is online.
    */
    fork(callback) {
      let WID = this._WIDcounter++;
      // Setup Master
      /**
       * Note that setup master doesn't
       * pass enviromental variables so
       * we create our own worker id and
       * pass it through argv
       */
      cluster.setupMaster({
        exec: process.cwd() + '/' + this._path,
        args: [WID],
        silent: false
      });

      // Fork a single worker (for now we only use one)
      let worker = cluster.fork();
      this._workers.set(WID, worker);
      
      // Our own specific version of `online`
      worker.once('message', function(message) {
        if ((message) && (message.__alive__ === true)) {
          callback(null, worker);
        }else{
          if (worker) worker.kill();
          callback(new Error("Worker failed on initialization and has been terminated."));
        }
      });
      
      // Handle messages and exceptions
      worker.on('message', (msg) => {
        if ((msg) && (typeof msg === 'object') && (msg.__exception__)) {
          // Log error
          console.log("EXCEPTION THROWN FROM WORKER ID", WID);
          console.log("MESSAGE:", msg.message);
          console.log("CODE:", msg.code);
          console.log(msg.stack);
        }
      });
      
      // Handle Crashes & Redeploy
      worker.once('exit', () => {
        this._workers.delete(WID);
        // Fork new Worker
        this.fork(() => {});
      });
      
    }

    /**
    * Begins the Daemon, instantiates your app. Initializers called first. Will only watch for changes when NODE_ENV is empty or set to "development"
    * @param {function} callback Method to execute when Application is finished initializing.
    */
    start(callback) {
      
      callback = typeof callback === 'function' ? callback : this._onStart;
      this._onStart = callback;
      
      // Fork the Application into another process
      this.fork((error, worker) => {
        if (error) return callback(error);
      });
      
      // When we are in development mode
      if ((process.env.NODE_ENV || 'development') === 'development') {
        // Watch for code changes
        this.watch('', this.restart.bind(this));
      }
      
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

      // Make sure we have a Worker
      if (this._workers.size) {
        // We only have one worker for now so this is rather easy
        let mapIterator = this._workers.value();
        let worker = mapIter.next().value;
        
        worker.send({ __destroy__: true });
        worker.once('message', (msg) => {
          if ((msg) && (typeof msg === 'object') && (msg.__destroy__ && msg.ready)) {
            
            worker.kill();
            worker.once('exit', (code, signal) => {
              onStop(() => {});
            });
            
          }
        });
        
      }else{
        
        onStop(() => {});
        
      }
      
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

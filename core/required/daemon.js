module.exports = (() => {

  'use strict';

  const cluster = require('cluster');
  const os = require('os');
  const http = require('http');
  const fs = require('fs');
  const ExecutionQueue = require('./execution_queue');

  /**
  * Multi-process HTTP Daemon that resets when files changed (in development)
  * @class
  */
  class Daemon {

    constructor() {

      this._error = null;
      this._server = null;
      this._port = null;

      this.cpus = os.cpus().length;
      this.children = [];

      process.on('exit', (code) => {

        console.log(`[Nodal.Daemon] Shutdown: Exited with code ${code}`);

      });

      if ((process.env.NODE_ENV || 'development') === 'development') {

        this.watch('', (changes) => {
          changes.forEach(change => {
            console.log(`[Nodal.Daemon] ${change.event[0].toUpperCase()}${change.event.substr(1)}: ${change.path}`);
          });
          this.children.forEach(child => child.send({invalidate: true}));
          !this.children.length && this.start();
        });

      }

      this.initializers = new ExecutionQueue();

    }

    /**
    * Starts the Daemon. If all application services fail, will launch a
    *   dummy error app on the port provided.
    * @param {Number} port
    */
    start(port) {

      this._port = port || 3000;

      console.log('[Nodal.Daemon] Startup: Initializing');

      this.initializers.exec((err) => {

        if (err) {
          this.error(err);
          return this.idle();
        }

        this._server && this._server.close();
        this._server = null;

        for (var i = 0; i < this.cpus; i++) {

          let child = cluster.fork();
          this.children.push(child);

          child.on('message', this.message.bind(this));
          child.on('exit', this.exit.bind(this, child));

        }

        console.log('[Nodal.Daemon] Startup: Spawning HTTP Workers');

      });

    }

    /**
    * Daemon failed to load, set it in idle state (accept connections, give dummy response)
    */
    idle() {

      let port = this._port || 3000;

      this._server = http.createServer((req, res) => {
        if (process.env.NODE_ENV !== 'production') {
          res.end(`Application Error\n\n${this._error.stack}`);
        } else {
          res.end(`Application Error`);
        }
        req.connection.destroy();
      }).listen(port);

      console.log(`[Nodal.Daemon] Idle: Unable to spawn HTTP Workers, listening on port ${port}`);

    }

    message(data) {

      data.error && this.error(data.error);

    }

    /**
    * Shut down a child process given a specific exit code. (Reboot if clean shutdown.)
    * @param {child_process} child
    * @param {Number} code Exit status codes
    */
    exit(child, code) {

      this.children.splice(this.children.indexOf(child), 1);

      if (code === 0) {
        child = cluster.fork();
        this.children.push(child);
        child.on('message', this.message.bind(this));
        child.on('exit', this.exit.bind(this, child));
      }

      if (this.children.length === 0) {
        this.idle();
      }

    }

    /**
    * Log an error on the Daemon
    * @param {Error} error
    */
    error(error) {

      this._error = error;
      this._server = null;
      console.log(`[Nodal.Daemon] ${error.name}: ${error.message}`);
      console.log(error.stack);

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

          if (v === 'node_modules' || v.indexOf('.') === 0) {
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

        if (changes.length) {
          onChange.call(self, changes);
        }

      };

      watchers.interval = setInterval(function() {

        let changes = [];

        Object.keys(watchers.directories).forEach(function(dirPath) {

          let dir = watchers.directories[dirPath];
          let files = fs.readdirSync(dirPath);
          let added = [];

          let contents = Object.create(null);

          files.forEach(function(v) {

            if (v === 'node_modules' || v.indexOf('.') === 0) {
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

      }, 1000);

      return this._watchers = watchers;

    }

  }

  return Daemon;

})();

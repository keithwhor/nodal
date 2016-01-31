module.exports = (() => {

  'use strict';

  const cluster = require('cluster');
  const os = require('os');
  const http = require('http');

  class Daemon {

    constructor(port) {

      this._error = null;
      this._server = null;
      this._port = port;

      this.cpus = os.cpus().length;
      this.children = [];

      process.on('exit', (code) => {

        console.log(`[Nodal.Daemon] Shutdown: Exited with code ${code}`);

      });

      this.start();

    }

    start() {

      this._server && this._server.close();
      this._server = null;

      for (var i = 0; i < this.cpus; i++) {

        let child = cluster.fork();
        this.children.push(child);

        child.on('message', this.message.bind(this));
        child.on('exit', this.exit.bind(this, child));

      }

      console.log('[Nodal.Daemon] Startup: Spawning HTTP Workers');

    }

    idle() {

      let port = this._port || 3000;

      this._server = http.createServer((req, res) => {
        res.end(`Application Error\n\n${this._error.stack}`);
        req.connection.destroy();
      }).listen(port);

      console.log(`[Nodal.Daemon] Idle: Unable to spawn HTTP Workers, listening on port ${port}`);

    }

    message(data) {

      data.error && this.error(data.error);

    }

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

    error(error) {

      this._error = error;
      this._server = null;
      console.log(`[Nodal.Daemon] ${error.name}: ${error.message}`);
      console.log(error.stack);

    }

  }

  return Daemon;

})();

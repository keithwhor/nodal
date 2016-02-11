module.exports = (() => {

  'use strict';

  const http = require('http');
  const url = require('url');

  class Application {

    constructor() {

      process.on('uncaughtException', e => {
        process.send({
          error: {
            name: e.name,
            message: e.message,
            stack: e.stack
          }
        });
        process.exit(1);
      });

      process.on('message', data => {
        data.invalidate && process.exit(0);
      });

      this.server = http.createServer(this.handler.bind(this));
      this.router = require(`${process.cwd()}/app/router.js`);

      console.log(`[Nodal.${process.pid}] Startup: Starting HTTP Worker`);

      process.on('exit', (code) => {
        console.log(`[Nodal.${process.pid}] Shutdown: Exited with code ${code}`);
      });

    }

    /**
    * Listens for incoming connections on a provided port
    * @param {Number} port
    */
    listen(port) {

      port = port || 3000;

      this.server.listen(port);
      console.log(`[Nodal.${process.pid}] Ready: HTTP Worker listening on port ${port}`);
      process.send({message: 'ready'});

    }

    getTime() {

      return new Date().valueOf();

    }

    /**
    * Logs a server response in the console
    * @param {Number} statusCode HTTP Status Code
    * @param {String} url The url that was hit
    * @param {String} t The time to execute the request
    */
    logResponse(statusCode, url, t) {

      let num = Math.floor(statusCode / 100);
      let str = '';
      if (num === 2) {
        str = 'Request OK';
      } else if (num === 3) {
        str = 'Request Redirect';
      } else if (num === 4) {
        str = 'Request Error';
      } else if (num === 5) {
        str = 'Server Error';
      } else {
        str = 'Unknown';
      }

      console.log(`[Nodal.${process.pid}] ${str} [${statusCode | 0}]: ${url} loaded in ${t} ms`);

    }

    /**
    * HTTP Request Handler
    * @param {http.ClientRequest} req
    * @param {http.ServerResponse} res
    */
    handler(req, res) {

      let body = new Buffer(0);
      let start = this.getTime();

      console.log(`[Nodal.${process.pid}] Incoming Request: ${req.url} from ${req.connection.remoteAddress}`);

      let route = this.router.find(req.url);

      if (!route) {
        res.writeHead(404, {});
        res.end('404 - Not found');
        let t = this.getTime() - start;
        this.logResponse(res.statusCode, req.url, t);
        return;
      }

      req.on('data', data => {
        body = Buffer.concat([body, data]);
        (body.length > 1E6) && (res.end(), req.connection.destroy());
      });

      req.on('end', () => {

        return this.router.dispatch(
          this.router.prepare(
            req.connection.remoteAddress,
            req.url,
            req.method,
            req.headers,
            body
          ),
          (err, status, headers, data) => {

            let t = this.getTime() - start;

            if (err) {
              res.writeHead(500, {});
              if (process.env.NODE_ENV !== 'production') {
                res.write(err.stack);
              } else {
                res.write('500 - Internal Server Error');
              }
              console.log(err.stack);
            } else {
              res.writeHead(status, headers);
              res.write(data);
            }

            this.logResponse(res.statusCode, req.url, t);
            res.end();

          }
        );

      });

    }

  }

  return Application;

})();

module.exports = (() => {

  'use strict';

  const http = require('http');
  const url = require('url');
  const utilities = require('./utilities.js');
  const API = require('./api.js');

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

      let hrTime = process.hrtime()
      return (hrTime[0] * 1000 + hrTime[1] / 1000000);

    }

    /**
    * Logs a server response in the console
    * @param {Number} statusCode HTTP Status Code
    * @param {String} url The url that was hit
    * @param {String} t The time to execute the request
    */
    logResponse(statusCode, url, t, str) {

      let num = Math.floor(statusCode / 100);
      str = str || '';
      if (num === 2) {
        str = str || 'Request OK';
      } else if (num === 3) {
        str = str || 'Request Redirect';
      } else if (num === 4) {
        str = str || 'Request Error';
      } else if (num === 5) {
        str = str || 'Server Error';
      } else {
        str = str || 'Unknown';
      }

      console.log(`[Nodal.${process.pid}] ${str} [${statusCode | 0}]: ${url} loaded in ${t} ms`);

    }

    /**
    * HTTP Request Handler
    * @param {http.ClientRequest} req
    * @param {http.ServerResponse} res
    */
    handler(req, res) {

      let body = [];
      let bodyLength = 0;
      let maxSize = utilities.parseSize(process.env.MAX_UPLOAD_SIZE) || utilities.parseSize('20MB');
      let start = this.getTime();

      console.log(`[Nodal.${process.pid}] Incoming Request: ${req.url} from ${req.connection.remoteAddress}`);

      let route = this.router.find(req.url);

      if (!route) {
        res.writeHead(404, {'Content-Type': 'application/json'});
        res.end(JSON.stringify(API.error('Not Found'), null, 2));
        let t = this.getTime() - start;
        this.logResponse(res.statusCode, req.url, t);
        return;
      }

      req.on('data', data => {
        body.push(data);
        bodyLength += data.length;
        if (bodyLength > maxSize) {
          res.writeHead(413, {'Content-Type': 'application/json'});
          res.end(JSON.stringify(API.error('Request Too Large'), null, 2));
          req.connection.destroy();
          let t = this.getTime() - start;
          this.logResponse(
            res.statusCode,
            req.url,
            t,
            `Request too large. (${bodyLength}, Max: ${process.env.MAX_UPLOAD_SIZE || '20MB'})`
          );
        }
      });

      req.on('end', () => {

        if (req.connection.destroyed) {
          return;
        }

        body = Buffer.concat(body);

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
              res.writeHead(500, {'Content-Type': 'application/json'});
              if (process.env.NODE_ENV !== 'production') {
                res.write(JSON.stringify(API.error('Internal Server Error', err.stack.split('\n')), null, 2));
              } else {
                res.write(JSON.stringify(API.error('Internal Server Error'), null, 2));
              }
              console.log(err.stack);
            } else {
              res.writeHead(status, headers);
              res.write(data);
            }

            this.logResponse(res.statusCode, req.url, t.toFixed(3));
            res.end();

          }
        );

      });

    }

  }

  return Application;

})();

module.exports = (() => {

  'use strict';

  const http = require('http');
  const url = require('url');

  const Dispatcher = require('./dispatcher.js');

  class Application {

    constructor(port) {

      process.on('uncaughtException', (e) => {
        process.send({
          error: {
            name: e.name,
            message: e.message,
            stack: e.stack
          }
        });
        process.exit(1);
      });

      this.server = http.createServer(this.handler.bind(this));
      this.router = require(`${process.cwd()}/app/router.js`);
      this.dispatcher = require(`${process.cwd()}/app/dispatcher.js`);

      console.log(`[Nodal.${process.pid}] Startup: Starting HTTP Worker`);

      process.on('exit', (code) => {
        console.log(`[Nodal.${process.pid}] Shutdown: Exited with code ${code}`);
      });

      this.listen(port);

    }

    listen(port) {

      port = port || 3000;

      this.server.listen(port);
      console.log(`[Nodal.${process.pid}] Ready: HTTP Worker listening on port ${port}`);
      process.send({message: 'ready'});

    }

    getTime() {

      return new Date().valueOf();

    }

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

    handler(req, res) {

      let body = new Buffer(0);
      let start = this.getTime();

      let urlData = url.parse(req.url, true);
      let path = urlData.pathname;
      if (path[path.length - 1] === '/') {
        path = path.substr(path, path.length - 1);
      }

      console.log(`[Nodal.${process.pid}] Incoming Request: ${req.url} from ${req.connection.remoteAddress}`);

      let route = this.router.find(path);

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

        let headers = Object.keys(req.headers).reduce((arr, h) => {
          arr.push(h);
          arr.push(req.headers[h]);
          return arr;
        }, []);

        let urlMatch = path.match(route.regex);
        let matches = urlMatch.slice(1).map(v => v || '');
        let routeParams = route.names.reduce((arr, name, i) => {
          arr.push(name);
          arr.push(matches[i]);
          return arr;
        }, []);

        let args = [].concat.apply(
          [],
          [
            req.connection.remoteAddress,
            req.url,
            req.method,
            path,
            route.controller,
            '--headers',
            headers,
            '--matches',
            matches,
            '--route',
            routeParams,
            '--body',
            body.toString('binary')
          ]
        );

        return this.dispatcher.dispatch(
          this.dispatcher.parse(args),
          (err, status, headers, data) => {

            let t = this.getTime() - start;

            if (err) {
              res.writeHead(500, {});
              res.write(err.stack);
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

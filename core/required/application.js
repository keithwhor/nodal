module.exports = (function() {

  'use strict';

  const Database = require('./db/database.js');
  const Composer = require('./composer/composer.js');
  const Router = require('./router.js');
  const SocketServer = require('./socket.js');
  const Template = require('./template.js');
  const Auth = require('./auth.js');
  const MiddlewareManager = require('./middleware_manager.js');
  const InitializerManager = require('./initializer_manager.js');
  const Scheduler = require('./scheduler/scheduler.js');

  const dummyRouter = require('./dummy_router.js');

  const dot = require('dot');
  const fs = require('fs');
  const http = require('http');
  const httpProxy = require('http-proxy');
  const mime = require('mime-types');
  const crypto = require('crypto');
  const async = require('async');

  // For templates
  dot.templateSettings.varname = 'data';
  dot.templateSettings.strip = false;

  class Application {

    constructor() {

      this.__create__();
      this.__setup__();
      this.__start__();

    }

    __create__() {

      this._proxy = null;

      this._forceProxyTLS = false; // not related to above

      this._templates = {
        '!': new Template(this, function() { return '<!-- Invalid Template //-->'; })
      };

      this._staticPath = '';
      this._static = {};

      this._db = {};

      this.router = null;
      this.socket = null;
      this.server = null;
      this.auth = null;
      this.scheduler = null;

      this.composer = new Composer();

      this.middleware = new MiddlewareManager();
      this.initializers = new InitializerManager();

    }

    __destroy__(done) {

      let cwd = process.cwd();
      let self = this;

      let fnComplete = function(err) {

        Object.keys(self).forEach(function(v) {
          delete self[v];
        });

        done.call(this);

      };

      if (this.scheduler) {
        this.scheduler.stop();
      }

      let cleanup = [];

      if (this.server) {

        let server = this.server;

        cleanup.push(function(callback) {
          server.__destroy__();
          server.close(callback);
        });

      }

      let db = this._db;

      cleanup = cleanup.concat(Object.keys(db).map(function(k) {
        return function(callback) {
          db[k].close(callback);
        }
      }));

      async.series(
        cleanup,
        fnComplete
      );

    }

    __setup__() {}
    __initialize__() {}

    __error__(err) {

      this.useRouter(dummyRouter(err));

    }

    __start__() {

      let fn = this.__initialize__;

      if ((process.env.NODE_ENV || 'development') === 'development') {

        fn = function(err) {

          if (err) {
            this.__error__(err);
          }

          this.__initialize__();

        }

      }

      this.initializers.exec(this, fn.bind(this));

    }

    loadStaticAssets(path) {

      if (path[path.length - 1] === '/') {
        path = path.substr(0, path.length - 1);
      }

      if (!path) {
        throw new Error('Can not use root project directory as static path');
      }

      if (path.indexOf('..') > -1) {
        throw new Error('Can not back-reference folders to use as static path');
      }

      function readDir(cwd, dirname, data) {

        data = data || {};
        let files = fs.readdirSync([cwd, dirname].join('/'));

        files.forEach(function(v) {

          let filename = [dirname, v].join('/');
          let fullPath = [cwd, filename].join('/');

          let stat = fs.statSync(fullPath);

          if (stat.isDirectory()) {
            readDir(cwd, filename, data);
            return;
          }

          let ext = fullPath.substr(fullPath.lastIndexOf('.'));
          let buffer = fs.readFileSync(fullPath);
          data[filename] = {
            mime: mime.lookup(ext) || 'application/octet-stream',
            buffer: buffer,
            tag: crypto.createHash('md5').update(buffer.toString()).digest('hex')
          };
          return;

        });

        return data;

      }

      this._staticPath = path;
      this._static = readDir(process.cwd(), path);

      return true;

    }

    static(name) {

      return this._static[[this._staticPath, name].join('/')] || null;

    }

    enableAuth() {

      this.auth = new Auth();

    }

    useScheduler(scheduler) {

      if (!(scheduler instanceof Scheduler)) {
        throw new Error('useScheduler requires valid Scheduler instance');
      }

      scheduler.setApp(this);
      scheduler.start();

      this.scheduler = scheduler;
      return true;

    }

    useRouter(router) {

      if (!(router instanceof Router)) {
        throw new Error('useRouter requires valid Router instance');
      }

      this.router = router;

      return true;

    }

    useDatabase(db, alias) {

      if (typeof alias !== 'string') {

        throw new Error('Alias required as the second argument of useDatabase');

      }

      if (this._db[alias]) {
        throw new Error('Database aliased with "' + alias + '" already added to application.');
      }

      if (!(db instanceof Database)) {
        throw new Error('useDatabase requires valid Database instance');
      }

      this._db[alias] = db;

      return true;

    }

    db(alias) {

      return this._db[alias] || null;

    }

    template(name) {

      if(this._templates[name]) {
        return this._templates[name];
      }

      let filename = './app/templates/' + name;

      try {
        let contents = fs.readFileSync(filename);
        this._templates[name] = new Template(this, dot.template(contents));
        return this._templates[name];
      } catch(e) {
        console.log(e);
        console.log('Could not load template ' + name);
      }
      return this._templates['!'];

    }

    _proxyWebSocketRequests() {

      if (this.server && this.socket && !this._proxy) {

        this._proxy = httpProxy.createProxyServer({ws: true});

        this.server.on('upgrade', (function (req, socket, head) {
          this._proxy.ws(req, socket, head, {target: 'ws://localhost:' + this.socket._port});
        }).bind(this));

      }

      return true;

    }

    requestHandler(request, response) {

      let error;

      if (this._forceProxyTLS &&
          request.headers.hasOwnProperty('x-forwarded-proto') &&
          request.headers['x-forwarded-proto'] !== 'https') {
        response.writeHead(302, {'Location': 'https://' + request.headers.host + request.url});
        response.end();
        return;
      }

      if (this.router) {

        try {

          this.router.delegate(this, request, response);
          return;

        } catch(e) {

          error = e.message;

        }

      } else {

        error = 'No router assigned';

      }

      response.writeHead(500, {'Content-Type': 'text/plain'});
      response.end('500 - Internal Server Error' + (error ? ': ' + error : ''));
      return;

    }

    listen(port) {

      if (this.server) {
        console.error('HTTP server already listening');
        return;
      }

      let server = http.createServer(this.requestHandler.bind(this)).listen(port);

      let clients = [];
      let availableIds = [];

      server.on('connection', function(socket) {

        if (availableIds.length) {
          socket.__id = availableIds.shift();
        } else {
          socket.__id = clients.length;
          clients.push(socket);
        }

        socket.on('close', function() {
          clients[socket.__id] = null;
          availableIds.push(socket.__id);
        });

      });

      server.__destroy__ = function() {

        clients.filter(function(socket) {
          return !!socket;
        }).forEach(function(socket) {
          socket.destroy();
        });

      };

      this.server = server;
      this._proxyWebSocketRequests();

      console.log('Nodal HTTP server listening on port ' + port);

      return true;

    }

    socketListen(port) {

      if (this.socket) {
        console.error('WebSocket server already listening');
        return;
      }

      this.socket = new SocketServer(port);

      this._proxyWebSocketRequests();

      console.log('Nodal WebSocket server listening on port ' + port);

      return true;

    }

    command() {
      if(!this.socket) {
        throw new Error('Application must socketListen before it can use commands');
      }
      this.socket.command.apply(this.socket, arguments);
    }

    forceProxyTLS() {

      this._forceProxyTLS = true;

    }

  }

  return Application;

})();

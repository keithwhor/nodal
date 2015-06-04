"use strict";

module.exports = (function() {

  const Database = require('./db/database.js');
  const Composer = require('./composer.js');
  const Router = require('./router.js');
  const SocketServer = require('./socket.js');
  const Template = require('./template.js');
  const Auth = require('./auth.js');
  const MiddlewareManager = require('./middleware_manager.js');
  const InitializerManager = require('./initializer_manager.js');

  const dot = require('dot');
  const fs = require('fs');
  const http = require('http');
  const httpProxy = require('http-proxy');
  const mime = require('mime-types');
  const crypto = require('crypto');

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

      this.composer = new Composer();

      this.middleware = new MiddlewareManager();
      this.initializers = new InitializerManager();

    }

    __destroy__(done) {

      let cwd = process.cwd();
      let self = this;

      let fnComplete = function() {

        Object.keys(require.cache).filter(function(v) {
          return v.indexOf(cwd) === 0 &&
            v.substr(cwd.length).indexOf('/node_modules/') !== 0;
        }).forEach(function(key) {
          delete require.cache[key];
        });

        Object.keys(self).forEach(function(v) {
          delete self[v];
        });

        done.call(this);

      };

      if (this.server) {
        this.server.__destroy__();
        this.server.close(fnComplete);
        return;
      }

      setTimeout(fnComplete, 1);

    }

    __setup__() {}
    __initialize__() {}

    __start__() {

      let fn = this.__initialize__;

      if ((process.env.NODE_ENV || 'development') === 'development') {

        fn = function(err) {

          this.__watch__();
          this.__initialize__(err);

        }

      }

      this.initializers.exec(this, fn.bind(this));

    }

    restart() {

      this.__destroy__(function() {

        require([process.cwd(), 'server.js'].join('/'));

      });

    }

    __watch__(path) {

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
          self.restart();
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

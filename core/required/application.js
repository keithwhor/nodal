module.exports = (function() {

  var Database = require('./db/database.js');
  var Composer = require('./composer.js');
  var Router = require('./router.js');
  var SocketServer = require('./socket.js');
  var Template = require('./template.js');
  var Auth = require('./auth.js');
  var MiddlewareManager = require('./middleware_manager.js');
  var InitializerManager = require('./initializer_manager.js');

  var dot = require('dot');
  var fs = require('fs');
  var http = require('http');
  var httpProxy = require('http-proxy');
  var mime = require('mime-types');

  // For templates
  dot.templateSettings.varname = 'data';
  dot.templateSettings.strip = false;

  function Application() {

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

  Application.prototype.initialize = function(callback) {

    this.initializers.exec(this, callback.bind(this));

  };

  Application.prototype.loadStaticAssets = function(path) {

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
      var files = fs.readdirSync([cwd, dirname].join('/'));

      files.forEach(function(v) {

        var filename = [dirname, v].join('/');
        var fullPath = [cwd, filename].join('/');

        if (fs.statSync(fullPath).isDirectory()) {
          readDir(cwd, filename, data);
          return;
        }

        var ext = fullPath.substr(fullPath.lastIndexOf('.'));
        data[filename] = {
          mime: mime.lookup(ext) || 'application/octet-stream',
          buffer: fs.readFileSync(fullPath)
        };
        return;

      });

      return data;

    }

    this._staticPath = path;
    this._static = readDir(process.cwd(), path);

    return true;

  };

  Application.prototype.static = function(name) {

    return this._static[[this._staticPath, name].join('/')] || null;

  };

  Application.prototype.enableAuth = function() {

    this.auth = new Auth();

  };

  Application.prototype.addDatabase = function(alias, connectionDetails) {

    if (this._db[alias]) {
      throw new Error('Database aliased with "' + alias + '" already added to application.');
    }

    var db = new Database();
    this._db[alias] = db;

    return db.connect(connectionDetails);

  };

  Application.prototype.db = function(alias) {

    return this._db[alias] || null;

  };

  Application.prototype.template = function(name) {

    if(this._templates[name]) {
      return this._templates[name];
    }

    var filename = './app/templates/' + name + '.html';

    var contents;
    try {
      contents = fs.readFileSync(filename);
      this._templates[name] = new Template(this, dot.template(contents));
      return this._templates[name];
    } catch(e) {
      console.log('Could not load template ' + name);
    }
    return this._templates['!'];

  };

  Application.prototype._proxyWebSocketRequests = function() {

    if (this.server && this.socket && !this._proxy) {

      this._proxy = httpProxy.createProxyServer({ws: true});

      this.server.on('upgrade', (function (req, socket, head) {
        this._proxy.ws(req, socket, head, {target: 'ws://localhost:' + this.socket._port});
      }).bind(this));

    }

    return true;

  };

  Application.prototype.requestHandler = function(request, response) {

    if (this._forceProxyTLS &&
        request.headers.hasOwnProperty('x-forwarded-proto') &&
        request.headers['x-forwarded-proto'] !== 'https') {
      response.writeHead(302, {'Location': 'https://' + request.headers.host + request.url});
      response.end();
      return;
    }

    this.router && this.router.delegate(this, request, response);

  };

  Application.prototype.listen = function(port) {

    if (this.server) {
      console.error('HTTP server already listening');
      return;
    }

    var router = require(process.cwd() + '/app/routes.js');

    var server = http.createServer(this.requestHandler.bind(this)).listen(port);

    this.server = server;
    this.router = router;

    this._proxyWebSocketRequests();

    console.log('Nodal HTTP server listening on port ' + port);

    return true;

  };

  Application.prototype.socketListen = function(port) {

    if (this.socket) {
      console.error('WebSocket server already listening');
      return;
    }

    this.socket = new SocketServer(port);

    this._proxyWebSocketRequests();

    console.log('Nodal WebSocket server listening on port ' + port);

    return true;

  };

  Application.prototype.command = function() {
    if(!this.socket) {
      throw new Error('Application must socketListen before it can use commands');
    }
    this.socket.command.apply(this.socket, arguments);
  };

  Application.prototype.forceProxyTLS = function() {

    this._forceProxyTLS = true;

  };

  return Application;

})();

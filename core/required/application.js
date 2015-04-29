module.exports = (function() {

  var Database = require('./db/database.js');
  var Router = require('./router.js');
  var SocketServer = require('./socket.js');
  var Template = require('./template.js');

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

    this._templates = {
      '!': new Template(this, function() { return '<!-- Invalid Template //-->'; })
    };

    this._static = {};

    this._db = {};

    this.router = null;
    this.socket = null;
    this.server = null;

    // process.on('SIGINT', (function() {
    //
    //   console.log('Gracefully exiting...');
    //   var closed = [];
    //   var fnKill = function() {
    //     closed.pop();
    //     (closed.length === 0) && process.kill();
    //   };
    //
    //   if (this.server) {
    //     closed.push();
    //     this.server.close(fnKill);
    //   }
    //
    //   if (this.socket) {
    //     closed.push();
    //     this.socket.close(fnKill);
    //   }
    //
    // }).bind(this));

  }

  Application.prototype.static = function(name) {

    if(this._static[name]) {
      return this._static[name];
    }

    var filename = './static/' + name;

    try {
      this._static[name] = {
        mime: mime.lookup(filename) || 'application/octet-stream',
        buffer: fs.readFileSync(filename)
      };
      return this._static[name];
    } catch(e) {
      return null;
    }

    return null;

  };

  Application.prototype.addDatabase = function(alias, connectionDetails) {

    var db = new Database();
    db.connect(connectionDetails);

    if (this._db[alias]) {
      throw new Error('Database aliased with "' + alias + '" already added to application.');
    }

    this._db[alias] = db;

    return true;

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

  Application.prototype.listen = function(port) {

    if (this.server) {
      console.error('HTTP server already listening');
      return;
    }

    var router = require(process.cwd() + '/app/routes.js');
    var server = http.createServer(router.delegate.bind(router, this)).listen(port);

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

  return Application;

})();

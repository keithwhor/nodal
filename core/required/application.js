module.exports = (function() {

  var Database = require('./db/database.js');
  var Router = require('./router.js')(Application);
  var SocketServer = require('./socket.js');
  var Template = require('./template.js');

  var dot = require('dot');
  var fs = require('fs');
  var http = require('http');
  var httpProxy = require('http-proxy');

  dot.templateSettings.varname = 'template';

  function Application() {

    this._router = new Router(this, port);
    this._server = null;
    this._proxy = null;

    this._templates = {
      '!': new Template(this, function() { return '<!-- Invalid Template //-->'; })
    };

    this.db = null;
    this.socket = null;

  };

  Application.prototype.useDatabase = function(credentials) {
    this.db = new Database(credentials);
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

  Application.prototype.listen = function(port) {

    this._server = http.createServer(this.execute.bind(this)).listen(port);

    console.log('Nodal server listening on port ' + port);

    return true;

  };

  Application.prototype.route = function() {
    this._router.route.apply(this._router, arguments);
  };

  Application.prototype.socketListen = function(port) {

    var socket = new SocketServer(port);

    this._proxy = httpProxy.createProxyServer({ ws: true });

    this._server && this._server.on('upgrade', (function (req, socket, head) {
      this._proxy.ws(req, socket, head, {target: 'ws://localhost:' + socket._port});
    }).bind(this));

    this.socket = socket;

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

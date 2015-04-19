module.exports = (function() {

  var Router = require('./router.js')(Application);
  var SocketServer = require('./socket.js');
  var Template = require('./template.js');
  var dot = require('dot');
  var fs = require('fs');

  dot.templateSettings.varname = 'template';

  function Application() {
    this._router = null;
    this._socker = null;
    this._templates = {
      '!': new Template(this, function() { return '<!-- Invalid Template //-->'; })
    };
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
    this._router = new Router(port);
    this._router.bindApplication(this);
    if(this._socket) {
      this._router.bindSocket(this._socket);
    }
  };

  Application.prototype.route = function() {
    if(!this._router) { throw new Error('Application must listen before it can route'); }
    this._router.route.apply(this._router, arguments);
  };

  Application.prototype.socketListen = function(port) {
    this._socket = new SocketServer(port);
    if(this._router) {
      this._router.bindSocket(this._socket);
    }
  };

  Application.prototype.command = function() {
    if(!this._socket) { throw new Error('Application must socketListen before it can use commands'); }
    this._socket.command.apply(this._socket, arguments);
  };

  return Application;

})();

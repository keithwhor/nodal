module.exports = (function() {

  var Database = require('./db/database.js');
  var Router = require('./router.js')(Application);
  var SocketServer = require('./socket.js');
  var Template = require('./template.js');
  var Model = require('./model.js');

  var dot = require('dot');
  var fs = require('fs');
  var http = require('http');
  var httpProxy = require('http-proxy');
  var mime = require('mime-types');

  dot.templateSettings.varname = 'template';

  function Application() {

    this._router = new Router(this);
    this._server = null;
    this._proxy = null;

    this._templates = {
      '!': new Template(this, function() { return '<!-- Invalid Template //-->'; })
    };

    this._static = this.loadStaticAssets();

    this.db = null;
    this.socket = null;

  }

  Application.prototype.loadStaticAssets = function() {

    // can probably lazy load, like templates

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

    return readDir(process.cwd(), 'static');

  };

  Application.prototype.static = function(path) {
    if (path.indexOf('/') === 0) {
      path = path.substr(1);
    }
    return this._static[path] || null;
  };

  Application.prototype.useDatabase = function() {
    this.db = new Database();
    this.db.connect(require(process.cwd() + '/db/credentials.js'));
    return true;
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

    if (this._server && this.socket && !this._proxy) {

      this._proxy = httpProxy.createProxyServer({ws: true});

      this._server.on('upgrade', (function (req, socket, head) {
        this._proxy.ws(req, socket, head, {target: 'ws://localhost:' + this.socket._port});
      }).bind(this));

    }

    return true;

  };

  Application.prototype.listen = function(port) {

    if (this._server) {
      console.error('HTTP server already listening');
      return;
    }

    this._server = http.createServer(this._router.execute.bind(this._router)).listen(port);

    this._proxyWebSocketRequests();

    console.log('Nodal HTTP server listening on port ' + port);

    return true;

  };

  Application.prototype.route = function() {
    this._router.route.apply(this._router, arguments);
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

  Application.prototype.saveModel = function(model, callback) {

    if (!(model instanceof Model)) {
      throw new Error('Can only save valid models.');
    }

    if(typeof callback !== 'function') {
      callback = function() {};
    }

    if (model.hasErrors()) {
      setTimeout(callback.bind(model, model.getErrors(), model), 1);
      return;
    }

    var columns = model.fieldList().filter(function(v) {
      return !model.isFieldPrimaryKey(v);
    }).filter(function(v) {
      return model.get(v) !== null;
    });

    var db = this.db;

    db.query(
      db.adapter.generateInsertQuery(model.schema.table, columns),
      columns.map(function(v) {
        return db.adapter.sanitize(model.getFieldData(v).type, model.get(v));
      }),
      function(err, result) {

        if (err) {
          model.error('_query', err.message);
        } else {
          result.rows.length && model.load(result.rows[0]);
        }

        callback.call(model, model.hasErrors() ? model.getErrors() : null, model);

    });

  };

  return Application;

})();

module.exports = (function() {

  var WebSocketServer = require('ws').Server;

  function SocketServer(port) {
    this._port = port | 0;
    this._server = new WebSocketServer({port: this._port});
    this._availableIds = [];
    this._clients = [];
    this._commands = {};
    this._server.on('connection', (function(ws) {
      var client = this.connect(ws);
      ws.on('message', this.receive.bind(this, client));
      ws.on('close', this.closeClient.bind(this, client));
    }).bind(this));

  }

  SocketServer.prototype.close = function(callback) {

    this._server.on('close', callback.bind(this));
    this._server.close();

  };

  SocketServer.prototype.allocate = function(ws) {
    var availableIds = this._availableIds;
    var clients = this._clients;
    var client;
    if(!availableIds.length) {
      client = new SocketClient(ws, clients.length);
      clients.push(client);
    } else {
      client = new SocketClient(ws, availableIds.pop());
      clients[client.id] = client;
    }
    return client;
  };

  SocketServer.prototype.deallocate = function(client) {
    this._clients[client.id] = null;
    this._availableIds.push(client.id);
    return true;
  };

  SocketServer.prototype.connect = function(ws) {
    var client = this.allocate(ws);
    console.log('Socket Client ' + client.id + ' connected');
    return client;
  };

  SocketServer.prototype.receive = function(client, message) {
    var data;
    try {
      data = JSON.parse(message);
    } catch(e) {
      data = {};
    }
    if(data.hasOwnProperty('command')) {
      if(data.hasOwnProperty('data')) {
        this.execute(client, data.command, data.data);
      } else {
        this.execute(client, data.command, {});
      }
    }
  };

  SocketServer.prototype.closeClient = function(client) {
    this.deallocate(client);
    console.log('Socket Client ' + client.id + ' disconnected');
    return true;
  };

  SocketServer.prototype.broadcast = function(command, data) {
    var clients = this._clients;
    for(var i = 0, len = clients.length; i < len; i++) {
      clients[i] && clients[i].send(command, data);
    }
    return true;
  };

  SocketServer.prototype.execute = function(client, command, data) {
    if(this._commands[command]) {
      this._commands[command].call(this, this, client, data);
    } else {
      client.send({error: 'Invalid command'});
    }
  };

  SocketServer.prototype.command = function(command, callback) {
    if(!command || typeof command !== 'string') { throw new Error('SocketServer requires valid command'); }
    if(typeof callback !== 'function') { throw new Error('SocketServer command requires valid callback'); }
    this._commands[command] = callback;
    return true;
  };

  /**/

  function SocketClient(ws, uniqid) {
    this._ws = ws;
    this.id = uniqid;
  }

  SocketClient.prototype.send = function(command, data) {
    if(typeof data === 'object') {
      try {
        data = JSON.stringify(data);
      } catch(e) {
        data = {};
      }
    } else {
      data = {};
    }
    this._ws.send(JSON.stringify({command: command, data: data}));
  };

  return SocketServer;

})();

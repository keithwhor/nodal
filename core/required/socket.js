"use strict";

module.exports = (function() {

  const WebSocketServer = require('ws').Server;

  class SocketServer {

    constructor(port) {
      this._port = port | 0;
      this._server = new WebSocketServer({port: this._port});
      this._availableIds = [];
      this._clients = [];
      this._commands = {};
      this._server.on('connection', (function(ws) {
        let client = this.connect(ws);
        ws.on('message', this.receive.bind(this, client));
        ws.on('close', this.closeClient.bind(this, client));
      }).bind(this));

    }

    close(callback) {

      this._server.on('close', callback.bind(this));
      this._server.close();

    }

    allocate(ws) {
      let availableIds = this._availableIds;
      let clients = this._clients;
      let client;
      if(!availableIds.length) {
        client = new SocketClient(ws, clients.length);
        clients.push(client);
      } else {
        client = new SocketClient(ws, availableIds.pop());
        clients[client.id] = client;
      }
      return client;
    }

    deallocate(client) {
      this._clients[client.id] = null;
      this._availableIds.push(client.id);
      return true;
    }

    connect(ws) {
      let client = this.allocate(ws);
      console.log('Socket Client ' + client.id + ' connected');
      return client;
    }

    receive(client, message) {
      let data;
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
    }

    closeClient(client) {
      this.deallocate(client);
      console.log('Socket Client ' + client.id + ' disconnected');
      return true;
    }

    broadcast(command, data) {
      let clients = this._clients;
      for(let i = 0, len = clients.length; i < len; i++) {
        clients[i] && clients[i].send(command, data);
      }
      return true;
    }

    execute(client, command, data) {
      if(this._commands[command]) {
        this._commands[command].call(this, this, client, data);
      } else {
        client.send({error: 'Invalid command'});
      }
    }

    command(command, callback) {
      if(!command || typeof command !== 'string') { throw new Error('SocketServer requires valid command'); }
      if(typeof callback !== 'function') { throw new Error('SocketServer command requires valid callback'); }
      this._commands[command] = callback;
      return true;
    }

  }

  class SocketClient {

    constructor(ws, uniqid) {
      this._ws = ws;
      this.id = uniqid;
    }

    send(command, data) {
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
    }

  }

  return SocketServer;

})();

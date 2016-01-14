module.exports = (function() {

  'use strict';

  const Database = require('./db/database.js');
  const Router = require('./router.js');
  const Template = require('./template.js');
  const Authorizer = require('./authorizer.js');
  const ExecutionQueue = require('./execution_queue.js');
  const Scheduler = require('./scheduler.js');
  const EndpointRequest = require('./endpoint_request.js');

  const dummyRouter = require('./dummy_router.js');

  const dot = require('dot');
  const fs = require('fs');
  const http = require('http');
  const httpProxy = require('http-proxy');
  const mime = require('mime-types');
  const crypto = require('crypto');
  const async = require('async');

  const domain = require('domain'); // TODO: Will be deprecated.

  // For templates
  dot.templateSettings.varname = 'params, data';
  dot.templateSettings.strip = false;

  /**
  * Core Nodal Application. Contains globally-applicable logic, methods and properties. Accessible by reference in any Controller or Task.
  * @class
  */
  class Application {

    /**
    * Three methods are run in order when instantiated, Application#__create__ then Application#__setup__ and finally, Application#__start__
    */
    constructor() {

      this.__create__();
      this.__setup__();
      this.__start__();

    }

    /**
    * Sets all internal properties for the Application to function as expected
    * @private
    */
    __create__() {

      this._proxy = null;

      this._forceProxyTLS = false; // not related to above
      this._forceWWW = false;

      this._templates = {
        '!': new Template(this, function() { return '<!-- Invalid Template //-->'; })
      };

      this._templateData = {};

      this._staticPath = '';
      this._static = {};

      this._db = {};

      this.router = null;
      this.server = null;
      this.scheduler = null;

      this.middleware = new ExecutionQueue();
      this.initializers = new ExecutionQueue();

    }

    /**
    * Cleans up the Application, closes outstanding HTTP requests
    * @param {Error} error An error message to send out to HTTP clients
    * @param {function} fnDone Method to execute when Application has been cleaned up successfully
    * @private
    */
    __destroy__(error, fnDone) {

      let cwd = process.cwd();
      let self = this;

      let fnComplete = function(err) {

        Object.keys(self).forEach(function(v) {
          delete self[v];
        });

        fnDone.call(this);

      };

      if (this.scheduler) {
        this.scheduler.stop();
      }

      let cleanup = [];

      if (this.server) {

        let server = this.server;

        cleanup.push(function(callback) {
          server.__destroy__(error);
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

    /**
    * Boilerplate method, intended to be overwritten when inherited (sets up Application initializers, etc.)
    * @private
    */
    __setup__() {}

    /**
    * Boilerplater method, overwritten by Daemon when spinning up Application
    * @private
    */
    __initialize__() {}

    /**
    * Used by Daemon to tells the Application to use the DummyRouter when given an error
    * @param {Error} err
    * @private
    */
    __error__(err) {

      this.useRouter(dummyRouter(err));

    }

    /**
    * Starts the Application. First runs initializers, then calls Application#__initialize__ which should be provided by the Daemon.
    * @private
    */
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

    /**
    * Loads all static assets into memory (RAM). Should be deprecated from this module and moved completely to initializer.
    * @to_deprecate
    * @param {string} path The directory from which to load static assets
    */
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

    /**
    * Returns static file data given a name (path) within the static directory.
    * @param {string} name Filepath from which to retrieve static data.
    * @return {Buffer} file data
    */
    static(name) {

      return this._static[[this._staticPath, name].join('/')] || null;

    }

    /**
    * Tell the Application which scheduler to use (only one can run in the main thread.)
    * @param {Nodal.Scheduler} scheduler
    * @return {boolean}
    */
    useScheduler(scheduler) {

      if (!(scheduler instanceof Scheduler)) {
        throw new Error('useScheduler requires valid Scheduler instance');
      }

      scheduler.setApp(this);
      scheduler.start();

      this.scheduler = scheduler;
      return true;

    }

    /**
    * Tell the Application which router to use.
    * @param {Nodal.Router} router
    * @return {boolean}
    */
    useRouter(router) {

      if (!(router instanceof Router)) {
        throw new Error('useRouter requires valid Router instance');
      }

      this.router = router;

      return true;

    }

    /**
    * Alias a database instance to Application#db
    * @param {Nodal.Database} db Database instance to alias
    * @param {string} alias Alias to use for the database (i.e. "main")
    * @return {boolean}
    */
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

    /**
    * Reference an aliased database
    * @param {string} alias
    * @return {Nodal.Database}
    */
    db(alias) {

      return this._db[alias] || null;

    }

    /**
    * Creates a new MockRequest object (emulates an HTTP request)
    * @param {string} path The path you wish to hit
    * @param {Object} query The query parameters you wish to pass
    * @return {Nodal.EndpointRequest}
    */
    endpoint(path, query) {

      return new EndpointRequest(this, path, query);

    }

    /**
    * Set default key-value pair for data objects to be sent to templates. i.e. "api_url" if you need it accessible from every template.
    * @param {string} name Key which you're setting for the data object
    * @param {any} value Value which you're setting for the specified key
    * @return {any}
    */
    setTemplateData(name, value) {
      this._templateData[name] = value;
      return value;
    }

    /**
    * Unsets template data for the specified key
    * @param {string} name Key which you're unsetting
    */
    unsetTemplateData(name) {
      delete this._templateData;
    }

    /**
    * Retrieves the template from the cache or loads the template and caches it
    * @param {string} The template name (full path in the the app/templates directory).
    * @param {optional boolean} raw Whether or not the template is "raw" (i.e. just an HTML string, no template engine required.) Defaults to false.
    * @return {Nodal.Template} The template instance
    */
    getTemplate(name, raw) {
      raw = !!raw | 0; // coerce to 0, 1

      if (!this._templates[name]) {
        this._templates[name] = Array(2);
      }

      if(this._templates[name][raw]) {
        return this._templates[name][raw];
      }

      let filename = './app/templates/' + name;

      try {

        let contents = fs.readFileSync(filename);

        this._templates[name][raw] = raw ? contents : dot.template(contents);

        return this._templates[name][raw];

      } catch(e) {

        console.log(e);
        console.log('Could not load template ' + name);

      }

      return this._templates['!'];
    }

    /**
    * Retrieves the template matching the provided name. Lazy loads new templates from disk, otherwise caches.
    * @param {string} templates List of heirarchy of templates (each a full path in the the app/templates directory).
    * @return {Nodal.Template} The template instance
    */
    template() {

      let templates = Array.prototype.slice.call(arguments)

      try {
        // Loop the template hierarchy, and return the first templates contents
        let templateContents = templates.map((name) => {
          return this.getTemplate(name, false);
        })[0];

        return new Template(
          this,
          templateContents,
          templates.slice(1).join(',')
        );

      } catch(e) {

        console.log(e);
        console.log('Could not load template ' + name);

      }

      return this._templates['!'];

    }

    /**
    * Retrieves a "raw" template (i.e. just an HTML string, no template engine required.)
    * @param {string} name The traw emplate name (full path in the the app/templates directory).
    * @return {Nodal.Template} The template instance
    */
    rawTemplate(name) {

      let contents = this.getTemplate(name, true);

      try {

        return new Template(
          this,
          function() { return contents; }
        );

      } catch(e) {

        console.log(e);
        console.log('Could not load raw template ' + name);

      }

      return this._templates['!'];

    }


    /**
    * Handles incoming http.ClientRequest and outgoing http.ServerResponse objects, routes them appropriately.
    * @param {http.ClientRequest} request
    * @param {http.ServerResponse} response
    */
    requestHandler(request, response) {

      let error;
      let host = request.headers.host;
      let protocol = 'http';
      let redirect = false;

      if (this._forceWWW && host.split('.').length === 2) {
        host = `www.${host}`;
        redirect = true;
      }

      if (this._forceProxyTLS &&
          request.headers.hasOwnProperty('x-forwarded-proto') &&
          request.headers['x-forwarded-proto'] !== 'https') {
        protocol = 'https';
        redirect = true;
      }

      if (redirect) {
        response.writeHead(302, {'Location': `${protocol}://${host}${request.url}`});
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

    /**
    * Tells the Application to start listening for incoming HTTP connections on a specified port
    * @param {number} port The port on which to begin listening
    */
    listen(port) {

      if (this.server) {
        console.error('HTTP server already listening');
        return;
      }

      let server = http.createServer((request, response) => {

        // TODO: Domains will be deprecated, remove to continue support

        let d = domain.create();

        d.on('error', (function(err) {

          if (!(err instanceof Error)) {
            err = new Error(err);
          }

          console.error(`* Request aborted: ${request.url}`);
          console.error(err.stack);

          if ((process.env.NODE_ENV || 'development') === 'development') {
            response.end(err.stack);
          } else {
            response.end('Controller Error');
          }

        }).bind(this));

        d.run(this.requestHandler.bind(this, request, response));

      }).listen(port);

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

      server.__destroy__ = function(error) {

        clients.filter(function(socket) {
          return !!socket;
        }).forEach(function(socket) {

          if (error) {

            console.error('*** Application Shutdown');
            console.error((error instanceof Error ? error.stack : error));

            if ((process.env.NODE_ENV || 'development') === 'development') {
              socket.end('Application Shutdown\n\n' + (error instanceof Error ? error.stack : error));
            } else {
              socket.end('Application Shutdown');
            }
          }

          socket.destroy();

        });

      };

      this.server = server;

      console.log('Nodal HTTP server listening on port ' + port);

      return true;

    }

    /**
    * Force SSL when going through a proxy (i.e., Heroku)
    */
    forceProxyTLS() {

      this._forceProxyTLS = true;

    }

    /**
    * Force redirect to WWW subdomain when accessed as a naked domain (no subdomain).
    */
    forceWWW() {

      this._forceWWW = true;

    }

  }

  return Application;

})();

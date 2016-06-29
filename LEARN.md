# Learn Nodal

Nodal follows MVC patterns you're probably familiar with from the simplicity
of Django and Rails. If you need more in-depth help,
[full API documentation is available here](http://www.nodaljs.com/static/docs/index.html). Otherwise,
let's get started!

# Starting Your Project

To begin your project, first install the latest version of Node (4.x) from
[nodejs.org](http://nodejs.org). Once you've completed that, open your
terminal and run:

```
npm install nodal -g
```
(If you get an error, run `sudo npm install nodal -g` or fix permissions permanently by [following these directions](https://docs.npmjs.com/getting-started/fixing-npm-permissions).
It will take a few seconds to finish. At this point, you have the Nodal
command line tools available and you can really get started!

Next, run:

```
nodal new
```

A few prompts will walk you through the project creation process. Once you're
done, visit your new project folder.

# Starting Your Server

Begin your Nodal server with:

```
nodal s
```

And voila! You'll notice the port that it's running on is `3000`. If you want to
change that, go to `config/secrets.json`:

```json
{

  "development": {
    "port": 3000,
  },

  "production": {
    "port": "{{= env.PORT }}",
  }

}
```

And modify the `"port": 3000,` line to whatever you'd like. Wait - is this magic?
Not really. **Every file in ./config/ will get loaded into a special Config object**.
Namely, into `Nodal.my.Config.{filename}` assuming `const Nodal = require('nodal')`.

Remember this! This is very important for setting environment variables. The
values that are loaded are based on your environment, set by your `NODE_ENV` environment
variable (defaults to development).

Let's see why the server is running on port 3000 by looking in `./cluster.js`...

```javascript
module.exports = (() => {

  'use strict';

  const Nodal = require('nodal');
  const cluster = require('cluster');

  if (cluster.isMaster) {

    const daemon = Nodal.require('app/daemon.js');
    daemon.start(Nodal.my.Config.secrets.PORT);

  } else {

    const app = new Nodal.Application();
    app.listen(Nodal.my.Config.secrets.PORT);


  }

})();
```

Not so magic after all. We're telling the server daemon to start, and once it's running,
to telling any application processes that spawn to listen on the provided port.

# Routing

Your server has started, but how do HTTP requests know where to go? Easy,
let's look in `./app/router.js`.

```javascript
module.exports = (function() {

  'use strict';

  const Nodal = require('nodal');
  const router = new Nodal.Router();

  /* Middleware */
  /* executed *before* Controller-specific middleware */

  const CORSMiddleware = Nodal.require('middleware/cors_middleware.js');
  // const ForceWWWMiddleware = Nodal.require('middleware/force_www_middleware.js');
  // const ForceHTTPSMiddleware = Nodal.require('middleware/force_https_middleware.js');

  router.middleware.use(CORSMiddleware);
  // router.middleware.use(ForceWWWMiddleware);
  // router.middleware.use(ForceHTTPSMiddleware);

  /* Renderware */
  /* executed *after* Controller-specific renderware */

  const GzipRenderware = Nodal.require('renderware/gzip_renderware.js')

  router.renderware.use(GzipRenderware);

  /* Routes */

  const IndexController = Nodal.require('app/controllers/index_controller.js');
  const StaticController = Nodal.require('app/controllers/static_controller.js');
  const Error404Controller = Nodal.require('app/controllers/error/404_controller.js');

  /* generator: begin imports */


  /* generator: end imports */

  router.route('/').use(IndexController);
  router.route('/static/*').use(StaticController);

  /* generator: begin routes */


  /* generator: end routes */

  router.route('/*').use(Error404Controller);

  return router;

})();
```

Things to make note of here: The design pattern for `module.exports = (function() { /*...*/ })()`
where you export an IIFE is the standard in Nodal. The reason we do this is to encourage
consistency in understanding what's getting exported. A developer looking to quickly debug
can jump to the bottom of a file and look for the return statement to see what was
actually exported.

First we see Middleware and Renderware being added to the Controller. Middleware
set on the router is executed *for every endpoint*, and happens *before*
Controller-specific middleware. Renderware is similarly executed on every
endpoint, but happens *after* Controller-specific renderware. The execution
flow looks like this...

```
Client Request ->
Controller#before ->
Router Middleware ->
Controller Middleware ->
Controller#get, put, post, del ->
Controller Renderware ->
Router Renderware ->
Controller#after ->
Server Response
```

Next, **Controllers are all loaded very explicitly**. This follows Django's routing
style. The router itself takes regex and will compare an incoming request to its
pattern in the order that they're added.

Also make note of the `/* generator: ... */` lines. These are used as boilerplate
for automatic controller importing / route addition from the command line file generators.
You should avoid removing these lines.

We see in the basic routing structure that we check to hit the index and the static
folder before going through generated routes (special cases) and finally fall
back to a 404 if nothing is hit.

# Controllers

So what exactly happens when you hit the index route? Exploring `./app/controllers/index_controller.js`
gives us the answer.

```javascript
module.exports = (function() {

  'use strict';

  const Nodal = require('nodal');

  class IndexController extends Nodal.Controller {

    get() {

      this.render(
        Nodal.Template.generate('index.html').render(
          this.params,
          {
            name: 'My Nodal Application'
          }
        )
      );

    }

  }

  return IndexController;

})();
```

When the index route is hit, a new *instance* of `IndexController` is created.
This is given some special properties accessible from referring to the instance.
Within a method, `this.params` contains client request parameters (`this.params.query`,
  `this.params.id`, `this.params.body`, `this.params.ip_address`, etc.) and
  `this.app` refers to your main `Application` instance, incase you need
  to access any "global" properties from it.

We can see here a `get()` method, which is called when an HTTP `GET` request
comes to the controller. Anything not specified will fall back to a
`501 - Not Implemented` response. Available methods that can be triggered from
a route are:

```javascript
get()
post()
put()
del()
options()
```

Or, some CRUD-like equivalents:
```javascript
index() // GET with no this.params.id
show() // GET with a this.params.id
create() // POST
update() // PUT
destroy() // DELETE
```

To render a string from within a controller, use `this.render()`. It can also
render JSON automatically if you provide a serializable object. **For API-formatted
responses use:** `this.respond()`. Other ways to respond to requests are
available [in the API documentation](http://www.nodaljs.com/static/docs/index.html).

## Using 'this' in Controllers

Please keep in mind that ES6 arrow functions (`fnAdd = (a, b) => a + b;`)
*do not create a new context for* `this`. If you have nested callbacks
in a Controller (quite common), it is a best practice to keep using anonymous
arrow functions to preserve your reference to the controller instance so responses
are easy to send out. (No `self = this;` anti-patterns.)

## Creating Controllers with the CLI

Create a new controller with the CLI using

```
nodal g:controller ControllerName
```

It will then create `controller_name_controller.js` in the base `./controllers/` directory.

If you'd like to put it in another directory, use:

```
nodal g:controller path/to/ControllerName
```

**Generating controllers this way will also automatically create best-guess routes
in router.js.**

You can create a controller for a specific model (auto include CRUD features) with:

```
nodal g:controller --for ModelName
```

# Models

Creating models is easy. Your project won't start out with any (they're not
necessary for all server types), but you can generate them with:

```
nodal g:model ModelName
```

This will create both a *Model* and a *Migration*. The Model will look like;

```javascript
module.exports = (function() {

  'use strict';

  const Nodal = require('nodal');

  class ModelName extends Nodal.Model {}

  ModelName.setDatabase(Nodal.require('db/main.js'));
  ModelName.setSchema(Nodal.my.Schema.models.ModelName);

  return ModelName;

})();
```

Our database is set from `./db/main.js` which grabs connection data from
`./config/db.json`. (Explore both files to see what's happening. Same as
`./config/secrets.json` above.) Note that Nodal currently only supports PostgreSQL.

Our schema is set from `Nodal.my.Schema` which automatically loaded `./db/schema.json`
upon starting the server. (**For this reason, Schema changes require app shutdowns and reloads.**)

## Special Models

Nodal comes with two "special", pre-built models. `User` and `AccessToken`.
Create these with:

```
nodal g:model --user
nodal g:model --access_token
```

These models just have some additional libraries / functionality included that
make things like passwords and OAuth a little bit easier. [Part 2 of the Introduction
screencast](https://www.youtube.com/watch?v=cQW4tgQsV_I) begins to cover this.

## Migrating Your Model

With your Model, a Migration was created in `./db/migrations`. In order to load
your Model data into a schema and create the necessary database connections,
make sure PostgreSQL is running and make sure your database is created:

```
nodal db:create
```

Once your database is created, prepare it for migrations (drops schema, clears table)

```
nodal db:prepare
```

And finally, run all pending migrations with:

```
nodal db:migrate
```

If you need to undo a migration simply run (one migration at a time):

```
nodal db:rollback
```

If you'd like to do a stepwise migrations or rollbacks, use the flag:

```
nodal db:migrate --step:1
```

## Using Your Model

To use your Model in a controller, import it with:

```
const Model = Nodal.require('app/models/my_model.js');
```

`Nodal.require` is just `require` pointing to your main app directory.

You can do fun things with your Model like;

```javascript
let myModel = new MyModel({field1: 'a', field2: 'b'}); // create a Model, not in db
myModel.save(err, callback); // Save model instance to db
myModel.destroy(err, callback); // Remove model instance from db
Model.create(params, callback); // creates and saves your model to db right away
Model.find(id, callback); // find a Model with a specified id
Model.update(id, params, callback); // update a Model with a specified id
Model.destroy(id, callback); // ... etc.

/* And queries! */
let query = Model.query(); // Instantiate Composer (ORM instance)


// method chaining :)
query
  .where({id__gt: 7})
  .orderBy('id', 'DESC')
  .limit(5)
  .where({field1__like: 'lol'})
  .end((err, myModels) => {

    // do something with my models

  });
```

## Postgres JSONB Column Type support

Nodal has basic support for the Postgres [JSONB data type](http://www.postgresql.org/docs/9.4/static/datatype-json.html). Any model that has a json column that contains a valid JSON object will have the object automatically marshalled in and out of the database. Let's walk through how to setup and use a model with a json column.

First, lets generate a new model

```nodal g:model Recipe name:string, flags:json```

Open the migration that was generated and you will see the following in the `up()` method.

```javascript
this.createTable("recipes", [{"name":"name","type":"string,"},{"name":"flags","type":"json"}])
```
Let's modify the up command to add an index on the json column. Your `up()` method should look something like this

```javascript    
up() {

  return [
    this.createTable("recipes", [{"name":"name","type":"string,"},{"name":"flags","type":"json"}])
    this.createIndex("recipes", "flags", "gin")
  ];

}
```

Nodal provides two comparator's for querying the json data for matches or existence. Lets assume our Recipe table contains a collection of recipes, and the flags json column contains flags related to dietary restrictions like vegetarian, vegan or paleo. Lets query for recipes that are Paleo only

```javascript
Recipe.query()
      .where({flags__json:{ paleo: true }})
      .end( (err,recipes) => {
        ......
      });
```

The `__json` comparator also allows for multi key queries:

```javascript
Recipe.query()
      .where({flags__json:{ vegan: true, paleo: true }})
      .end( (err,recipes) => {
        ......
      });
```




What if you want to query for all recipes that contain a certain key.

```javascript
Recipe.query()
      .where({flags__jsoncontains: 'paleo'})
      .end( (err,recipes) => {
        ......
      });
```


## What Now?

There's still a bunch more to cover! Information on in-depth Migrations,
Middleware, Schedulers, Tasks and Workers is coming soon.

Please [watch the repository, keithwhor/nodal](http://github.com/keithwhor/nodal)
for updates.

Keep up with screencasts and more details on [nodaljs.com](http://nodaljs.com).

Follow me on Twitter, [@keithwhor](http://twitter.com/keithwhor)

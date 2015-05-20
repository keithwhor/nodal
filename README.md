# Nodal
## An ES6 API Server and Framework for iojs

[![Build Status](https://travis-ci.org/keithwhor/nodal.svg?branch=master)](https://travis-ci.org/keithwhor/nodal)

**v0.2.x is pre-release, suggested for use in development only**

Nodal is an opinionated API Server and Framework for quickly generating
RESTful API services in [iojs](https://iojs.org/) using modern ES6 syntax
and idioms.

With the rise of client-side Single Page Applications, Nodal helps keep your
concerns separated and focuses on being able to easily develop your back-end
API with light support for static resources and templating where the need
arises.

Boasting a built-in command-line interface, models, controllers, templates,
migrations and application architecture, Nodal provides all of the tools a
developer needs to get a new iojs project started in a very short amount of
time.

## Features

- ES6
- Models
- Controllers
- Templates
- Migrations
- Routing
- Query Composition
- Multiple database connections
- Multiple environment configurations
- Middleware (gzip/deflate middleware pre-packaged)
- Initializers

Additionally, a built-in CLI that supports:

- Starting a new project
- Easy generation of models, controllers, migrations, middleware, initializers
- Database drop, create, prepare, migrate, rollback
- Running your Nodal server

Nodal comes configured to deploy to Heroku easily (using git) for rapid
prototyping.

# Table of Contents

1. [Installation](#installation)
2. [Getting Started](#getting-started)
3. [Create a RESTful resource](#create-a-restful-resource)
4. [Documentation](#documentation)
    - [Directory Structure](#directory-structure)
    - [Configuration](#configuration)
    - [Initialization](#initialization)
    - [Router](#router)
    - [Controllers](#controllers)
        * [Controller methods](#controller-methods)
            + [method parameter self](#method-parameter-self)
            + [method parameter params](#method-parameter-params)
            + [method parameter app](#method-parameter-app)
    - [Templates](#templates)
    - [Databases](#databases)
    - [Models](#models)
        * [Model methods](#model-methods)
            + [\_\_preInitialize\_\_](#__preinitialize__)
            + [\_\_postInitialize\_\_](#__postinitialize__)
        * [Model.prototype.schema](#model.prototype.schema)
        * [Model.prototype.externalInterface](#model.prototype.externalinterface)
    - [Migrations](#migrations)
        * [Ready to migrate](#ready-to-migrate)
5. [Appendix](#appendix)
    - [Project Direction](#project-direction)
    - [Why Nodal](#why-nodal)
    - [About](#about)

# Installation

To install the latest version of Nodal, make sure you have
[iojs](https://iojs.org/) installed.

You can then run:

```
$ sudo npm install nodal -g
```

And voila! You now have access to the Nodal command-line interface.

If you're intending on data layer integration, Nodal only supports Postgres at
present time. I personally recommend using
[Postgres.app](http://postgresapp.com/) for your dev environment if you're
running OSX.

# Getting Started

Docs are a work in progress, so if you want to just dive in, follow these simple
instructions to start hacking away with Nodal. ;)

Getting started with Nodal is simple. Just run `nodal new` and you'll be guided
through the process. Nodal will create a project directory for you in your
current directory based on your project name.

Now you can run `nodal s` to start your server, and voila! Your index page will
be available at `localhost:3000` under default configurations. A 404 page and
static resources page are also available. (Static resources are stored in
  your `./static/` directory.)

# Create a RESTful resource

First, Make sure you have Postgres installed. (OSX developers check out
  [Postgres.app](http://postgresapp.com/).)

Next, create a "postgres" superuser with no password if one does not already exist
```
$ createuser postgres -s
```

Open your `app/init.js` file and uncomment the lines:
```javascript
// const db = Nodal.require('db/main.js');
// app.useDatabase(db, 'main');
```

Finally, run the following commands:
```
$ nodal db:create
$ nodal db:prepare
$ nodal g:model --user
$ nodal g:controller v1 --for:User
$ nodal db:migrate
```

Now run your server again using `nodal s`, and you should be able to run GET,
POST, PUT, and DELETE requests to `localhost:3000/v1/users`.

Look in `app/routes.js`, `app/controllers/v1/users_controller.js`,
`app/models/user.js`, `app/db/schema.json` and `app/db/migrations` to see what
went on behind the scenes. :)

# Documentation

## Directory Structure

Nodal uses the following directory structure:

```
-- [app]
  \-- [controllers]
  \-- [models]
  \-- [templates]
  \-- init.js
  \-- routes.js
-- [config]
-- [db]
-- [initializers]
-- [middleware]
-- [static]
-- .nodal
-- Procfile
-- server.js
```

Most of these directories will be pre-populated with some boilerplate examples
so you can begin getting comfortable with the application architecture.

## Configuration

(The following assumes you're including Nodal using
`const Nodal = require('nodal');`)

While Nodal for the most part favors convention-over-configuration, you can set
environment-specific secrets in the `config` folder by
creating `.json` files with your application secrets. These will be loaded into
your `Nodal.my.Config` object based on their filenames, with the environment
dictated by the `NODE_ENV` environment variable of your process (defaults to
  `'development'`).

For example, the `db.json` values associated with `"development"` will get
loaded into `Nodal.my.Config.db` when you run Nodal locally.

## Initialization

`app/init.js` is the bootstrapping script for your server.

You should use it to assign initializers, middleware, bind your data layers, and
prepare your application to listen for incoming connections.

**If you want to use a data layer, make sure you un-comment app.useDatabase!**

```javascript
module.exports = (function() {

  "use strict";

  const Nodal = require('nodal');
  const app = new Nodal.Application();

  /* use initializer */
  const StaticAssetInitializer = Nodal.require('initializers/static_asset_initializer.js');
  app.initializers.use(StaticAssetInitializer);

  /* use middleware */
  const GzipMiddleware = Nodal.require('middleware/gzip_middleware.js');
  app.middleware.use(GzipMiddleware);

  /* use router */
  const router = Nodal.require('app/router.js');
  app.useRouter(router);

  /* use database, assign an alias */
  // const db = Nodal.require('db/main.js');
  // app.useDatabase(db, 'main');

  /* Initialize App */
  app.initialize(function() {

    app.listen(Nodal.my.Config.secrets.port);

  });

})();
```

As shown here, Nodal comes pre-packaged with an initializer and middleware.

The `StaticAssetInitializer` pre-loads all static assets into RAM at present time
(be wary of this constraint) before the application begins listening for
connections. All Initializers will be run, in the order they're added, upon a
call to `app.initialize()`.

The `GzipMiddleware` uses deflate/gzip compression on page renders, if
applicable. Middleware, in regards to Nodal, intercepts `Controller#render`
calls and applies transformations and state changes to the controller and
associated rendering data.

## Router

Your router is set up in `app/router.js` with its associated router.s
You must import each `Controller` you wish to use separately, and tell the
router what regular expression to match compare the request url against.

As an example,

```javascript
const IndexController = Nodal.require('app/controllers/index_controller.js');

router.route(/^\/?$/, IndexController);
```

*Any match* to the provided regular expression will cause the router to proceed
with following the route to the controller.

Routes are ordered by priority, with routes declared first getting match
precedence over routes declared subsequently. If no route is matched to a
request, Nodal will fall back basic plaintext 404 error.

You'll also notice the use of `Nodal.require`, which acts as a wrapper for
`require`, automatically targeting the root directory of your application.

## Controllers

New controllers can be generated with:

```
$ nodal g:controller name
```

or, if you want a controller to be associated with a model,

```
$ nodal g:controller namespace --for:model_name
```

For example, `nodal g:controller test` would create
`./app/controllers/test_controller.js`, `nodal g:controller ns/test` would
create `./app/controllers/ns/test_controller.js`, and
`nodal g:controller ns --for:test` would create
`./app/controllers/ns/test_controller.js` that contains a `require` for a model
named `Test`.

One of the first things you'll notice about your Nodal project is that you
already have some controllers set up, mainly an `IndexController`, an
`Error404Controller` and a `StaticController`.

We'll examine `controllers/error/404_controller.js` to begin:

```javascript
module.exports = (function() {

  "use strict";

  const Nodal = require('nodal');

  class Error404Controller extends Nodal.Controller {

    get(self, params, app) {
      self.status(404);
      self.render(app.template('error/404.html'), params);
    }

  }

  return Error404Controller;

})();
```

As seen here, the `get` method is associated with an HTTP GET request.

### Controller methods

Currently supported request types are `GET`, `POST`, `PUT` and `DELETE` via
`get`, `post`, `put` and `del`, respectively. All four methods take the same
parameters.

#### method parameter self

The `self` parameter contains a reference to the controller. The reason for this
is to avoid having to use `let self = this` in the body of your function in
preparation for asynchronous processing.

#### method parameter params

`params` is an object with the following properties: `path`, `id`, `query`,
  `body`, `ip_address`, `headers`.

`params.path` is an Array containing the result of a regex match to your route,
including capturing groups. For example, the route `/^\/static\/(.*)/` with the
request url as `/static/image.jpg` would have a `params.path` value of
`['/static/image.jpg', 'image.jpg']`.

`params.id` is the part of your request url that isn't matched by your route,
if applicable. For example, if your route was `/^\/users\/?/` with the request
url `/users/52`, `params.id` would have a value of `'52'`.

`params.query` is an object containing your query string parameters,
  if applicable.

`params.body` is an object containing any HTTP POST body data, if applicable.

#### method parameter app

App refers to your main application object as defined in `init.js`,
which has references to your databases, the query composer and additional
features.

## Templates

Nodal is strongly opinionated on view implementation in order to maintain a
streamlined application. API responses (from models or sets of model results)
are highly structured and adhere to a strict format to maintain consistency.
There is no formal "View" object, with objects (and Models) being automatically
converted to JSON. Externally viewable model properties are included in the
model definition. This tight coupling is intentional.

Templates are all compiled using the lightweight
[doT.js](http://olado.github.io/doT/index.html) templating engine and can be
accessed through `app.template(path)` where path is the relative path of your
template within the `templates` directory. If you pass a template to a
`Controller#render` call, the second argument of the call is used as the `data`
object in the template.

There is no intention to add to the complexity of templates, as Nodal is
intended to primarily be used as an API server.

## Databases

Set up your database in `app/init.js` by adding the lines:

```javascript
const db = Nodal.require('db/main.js');
app.useDatabase(db, 'main');
```

This will allow you to access your `'main'` database instance via
`app.db('main')`. Multiple databases can be aliased using the
`Application#useDatabase` method.

You can set up each additional database similar to `app/db/main.js`. Use one
file for each additional database.

## Models

Models and migrations go hand-in-hand. While you can create models that are
migration-independent, that's a little more advanced, so let's keep them coupled
for now.

If you want to jump in to some code and look at a pre-fabricated model, Nodal
has a built-in user model that can be generated using:

```
$ nodal g:model --user
```

Otherwise, create your first Model manually. :)

```
$ nodal g:model Person name:string age:int
```

Which will generate the necessary model and migration.

Supported data types are:

```
serial
int
currency
float
string
text
datetime
boolean
```

Nodal also supports `array` types with PostgreSQL, and these fields can be
generated automatically using:

```
$ nodal g:model HasAnArray arr_of_ints:int:array arr_of_strings:string:array
```

Your `Person` model will look a little something like this:

```javascript
module.exports = (function() {

  "use strict";

  const Nodal = require('nodal');

  class Person extends Nodal.Model {

    __preInitialize__() {}
    __postInitialize__() {}

    /* Model Extensions */

  }

  Person.prototype.schema = Nodal.my.Schema.models.Person;

  Person.prototype.externalInterface = [
    'id',
    'name',
    'age',
    'created_at'
  ];

  return Person;

})();
```

### Model methods

#### \_\_preInitialize\_\_

This method is run before the model is initialized (values set, data loaded).
It is intended to be used for preparing your model validations. An example
would be:

```javascript
__preInitialize__() {

  this.validates(
    'name',
    'must be at least five characters in length',
    function(value) {
      return value && value.length > 5;
    }
  );

}
```

#### \_\_postInitialize\_\_

This method is run after data is loaded and validations are run.

### Model.prototype.schema

A reference to your schema (containing table and column data) for your model

### Model.prototype.externalInterface

These are a list of whitelisted or "secure" fields that are allowed to be shown
on the external interface of your API (an API response). The query composer
uses this property with `Composer#externalQuery`.

## Migrations

If you've followed the previous step, you already have a migration. You can
also create an empty migrate using `nodal g:migration MigrationName`.

Since you have a migration ready, it's time to prepare your database. First set
your local connection details in `config/db.json` (only PostgreSQL is currently
supported), then run:

```
$ nodal db:create
$ nodal db:prepare
```

If you run into issues with these commands (under default configurations),
and you're using [Postgres.app](http://postgresapp.com/), run the following in
your command line:

```
$ createuser postgres -s
```

This will create the database specified and then prepare it for migrations.
Note that `db:prepare` will *always* reset all migrations and your schema. Be
careful!

### Ready to migrate

From the previous step, we'll see that we have a migration in `db/migrations/`
that looks something like this:

```javascript
module.exports = (function() {

  "use strict";

  const Nodal = require('nodal');

  class CreatePerson extends Nodal.Migration {

    constructor(db) {
      super(db);
      this.id = 2015051801423419;
    }

    up() {

      return [
        this.createTable("people", [{"name":"name","type":"string"},{"name":"age","type":"int"}])
      ];

    }

    down() {

      return [
        this.dropTable("people")
      ];

    }

  }

  return CreatePerson;

})();
```

How do we run it? easy!

```
$ nodal db:migrate
```

And your `persons` table from the previous step should have been created.

If you want to undo a change, use:

```
$ nodal db:rollback --step:1
```

Note that `--step:1` is an optional flag. The default rollback count is `1`,
up to however many migrations you have. `--step` can also be provided for
`db:migrate`.

# Appendix

Nodal is under *very* active development, with version 0.2.x representing a
pre-release version. The plan is to transition 0.2.x to 1.x once the intended
feature set is included, the architecture is solidified and test coverage is
thorough.

At present time, Nodal only supports PostgreSQL. With full support for SQL
adapters, it is a priority to allow for other data layers soon.

Docs will be fleshed out ASAP! Thanks for your patience. :)

## Project Direction

The following features are in development on Nodal 0.2.x

- Test coverage (in progress)
- Model relationships (links to other models)
- Task scheduler
- Easy authorization (requires redis for more than one instance)
- WebSocket integration (commands responses, requires redis for more than one instance)

## Why Nodal

The short answer is because building stuff is fun. ;)

The JavaScript community is very fragmented, and for the most part, that's
actually a fantastic thing. A lot of innovation comes from a lot of different
groups with wildly different agendas. The problem is that it's kind of hard to
figure out where to start. I know the things I need in an application to make my
life easy - and I know they all exist within the npm ecosystem. But if I'm going
to start picking and choosing, how do I know what's best? How do I ensure I
build a consistent, stable architecture? Library implementations can all differ
fundamentally, making the code you have to write seem inconsistent or confusing
to tie the different pieces together.

To somebody coming from Django or Rails, this can seem exhausting. I think
JavaScript should be as inclusive and welcoming as possible.

The wonderful thing about ES6 is it provides clear solutions for how to
implement inheritance and in doing so, allows us to begin creating strong idioms
for application architecture in JavaScript. What interests me is having code
that any developer can understand and architecture that is easy to reason about.
This is the goal of Nodal. To be clear, concise, consistent, easy to learn and
full-featured.

## About

Nodal is under active development and maintained by
[Keith Horwood](http://keithwhor.com).

Follow me on Twitter, [@keithwhor](http://twitter.com/keithwhor)

Fork me on GitHub, [keithwhor](http://github.com/keithwhor)

Thanks for checking out Nodal!

Feel free to open issues related to any questions
you might have. Suggestions for project direction are helpful as well, if
there's anything you believe Nodal is missing.

PRs are welcome but will be screened thoroughly for code style
as well as how they fit into the overall architecture. I will be picky.
Suggestions for active areas of cleanup / improvement are on tests and the CLI.

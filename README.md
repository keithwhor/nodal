# Nodal
## A Next-Generation API Server and Framework for iojs

[![Build Status](https://travis-ci.org/keithwhor/nodal.svg?branch=master)](https://travis-ci.org/keithwhor/nodal)

**v0.2.x is pre-release, suggested for use in development only**

Nodal is an API Server and Framework for quickly generating RESTful API
services in [iojs](https://iojs.org/).

It is intended to be used for cross-platform applications with various
client-side implementations or loosely-coupled services where responses to
requests are generally limited to structured data. (Though there is
support for HTML and static resources, they are not a priority.)

Nodal makes use of modern ES6 idioms to make your application code concise and
easy to follow.

With a built-in command-line interface, models, controllers, templates,
migrations and application architecture, Nodal provides all of the tools a
developer needs to get a new iojs project started with very little overhead.

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

## Installation

To install the latest version of Nodal, make sure you have [iojs](https://iojs.org/) installed.

You can then run:

```
$ sudo npm install nodal -g
```

And voila! You now have access to the Nodal command-line interface.

## Getting Started

Getting started with Nodal is simple. Create your project folder and run
`nodal new` to instantiate a new project in the folder.

Here's an example:

```
$ cd ~
$ mkdir my_nodal_project
$ cd my_nodal_project
$ nodal new
```

Now you can run `nodal s` to start your server, and voila! Your index page will
be available at `localhost:3000` under default configurations.

## Creating your first Nodal model

You can create a model `Dog` with fields `name` and `age` using:

```
$ nodal g:model Dog name:string age:int
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

## Running your first Nodal migration

Now that you've created the model and migration file (from the last step),
prepare your database. First set your local connection details in
`db/credentials.json` (only PostgreSQL is currently supported), then run:

```
$ nodal db:create
$ nodal db:prepare
```

This will create the database specified and then prepare it for migrations.
Note that `db:prepare` will *always* reset all migrations and your schema. Be
careful!

Now run:

```
$ nodal db:migrate
```

And your `dogs` table from the previous step should have been created.

If you want to undo a change, use:

```
$ nodal db:rollback --step:1
```

Note that `--step:1` is an optional flag. The default rollback count is `1`,
up to however many migrations you have. `--step` can also be provided for
`db:migrate`.

## More...

Nodal is *very* active development, with version 0.2.x representing a
pre-release version. The plan is to transition 0.2.x to 1.x once the intended
feature set is included, the architecture is solidified and test coverage is
thorough.

At present time, Nodal only supports PostgreSQL. With full support for SQL
adapters, it is a priority to allow for other data layers soon.

## Project Direction

The following features are in development on Nodal 0.2.x

- Test coverage (in progress)
- Model relationships (links to other models)
- Task scheduler
- Easy authorization (requires redis for more than one instance)

## About

Nodal is under active development and maintained by
[Keith Horwood](http://keithwhor.com).

Follow me on Twitter, [@keithwhor](http://twitter.com/keithwhor)

Fork me on GitHub, [keithwhor](http://github.com/keithwhor)

Thanks for checking out Nodal! Feel free to open issues related to any questions
you might have. Suggestions for project direction are helpful as well, if
there's anything you believe Nodal is missing.

PRs are welcome but will be screened thoroughly for code style
as well as how they fit into the overall architecture. I will be picky.
Suggestions for active areas of cleanup / improvement are on tests and the CLI.

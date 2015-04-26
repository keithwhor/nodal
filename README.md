# Nodal: An API Framework for node.js

**v0.1.x is pre-release, and is intended for testing purposes only**

Nodal is framework for quickly creating API servers in node.js.

It is intended to be used for cross-platform applications with various
client-side implementations or loosely-coupled services where responses to
requests are generally limited to structured data. (Though there is
support for HTML and static resources, they are not a priority.)

With a built-in command-line interface, models, controllers, templates,
migrations and application architecture, Nodal provides all of the tools a
developer needs to get a new node.js project started with very little overhead.

## Installation

To install the latest version of Nodal, make sure you have node.js installed.

You can then run (may need superuser privileges):

```
$ npm install nodal -g
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

Nodal is currently under *very* active development, so expect things to change
constantly. The 0.1.x family (currently master branch) is pre-release.

At present time, Nodal only supports PostgreSQL. With full support for SQL
adapters, it is a priority to allow for other data layers soon.

## Active Development

The following is an active development checklist (TODO):

### Models

- Model permanence state management (is it in the DB as far as we know?)
- Model querying
- Model relationships (belongs_to, has_many)

### Misc.

- Offload all SQL generation to DatabaseAdapter
- Keep track of indices in schema.json
- Tests for all modules (!!!)

## About

Nodal is under active development and maintained by
[Keith Horwood](http://keithwhor.com).

Follow me on Twitter, [@keithwhor](http://twitter.com/keithwhor)

Fork me on GitHub, [keithwhor](http://github.com/keithwhor)

Thanks for checking out Nodal! Feel free to open issues related to any questions
you might have. Please hold off on PRs for v0.1.x (unless under exceptional
circumstances) as things are apt to change very quickly - including major
refactors and rewrites.

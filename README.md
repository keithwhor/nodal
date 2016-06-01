# Nodal
## API Services Made Easy with Node.js

[![Build Status](https://travis-ci.org/keithwhor/nodal.svg?branch=master)](https://travis-ci.org/keithwhor/nodal) [![Join the chat at https://gitter.im/keithwhor/nodal](https://badges.gitter.im/keithwhor/nodal.svg)](https://gitter.im/keithwhor/nodal?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

![Nodal Logo](./nodal.png)

View the website at [nodaljs.com](http://nodaljs.com).

Nodal is a web server and opinionated framework for building
data manipulation-centric (Create Read Update Destroy) API services in Node.js for
web, mobile or IoT apps.

## Why Nodal?

[Hello, Nodal — Building Node.js Servers for Everybody](https://medium.com/@keithwhor/hello-nodal-why-we-re-building-node-js-servers-for-everybody-dce14b27a233)
is our first blog post that helps you get acquainted with the reasons behind
the creation of the framework. :)

[Post Parse Prototyping](https://thoughts.ishuman.co/post-parse-prototyping-72b8570af416) is also a fantastic
read explaining the benefits of Nodal for quick and easy mobile / IoT backend development.

## Overview

Nodal is built upon an ideology of a robust, scalable architecture for
data storage and retrieval APIs.
It is an opinionated, explicit, idiomatic and highly-extensible full-service
framework that takes care of all of the hard decisions for you and your team.
This allows you to focus on creating an effective product in a
short timespan while minimizing technical debt.

Nodal servers are not meant to be monoliths. They're *stateless* and *distributed*,
meant to service your needs of interfacing with your data layer effortlessly.
While you can output any data format with Nodal, it's recommended you offload
things like static page rendering to other optimized services like CDNs.

Nodal projects are ready to deploy to [Polybit](https://polybit.com) right out of
the box, so you can have your website live in no time with `nodal poly:deploy`.

[Check out the first Nodal Screencast here.](https://www.youtube.com/embed/IxBXkFbUqtk)

## Stateless Dogma

It's important to note that Nodal is meant for **stateless** API services. This
means you should not rely on memory within a specific process to serve multiple
requests, and Nodal will use process clustering (even in development) to actively
discourage this practice. If you need to work with unstructured data for rapid
prototyping, *connect Nodal to a PostgreSQL database* and use the "JSON" field
type. You'll find yourself encountering a lot of trouble if you start trying to
use in-process memory across different requests.

Remember: **one input, one output**. Side effects dealing with model state
should be managed via your Database. Nodal should not be used for streaming
(long poll) requests and the HTTP request and response objects are intentionally
obfuscated.

This also means you *can not rely on socket connections*. If you need to
incorporate realtime functionality in your application, there should be a
separate server responsible for this. It can interface with your Nodal API
server and even receive events from it, but your API server should never have
a stateful (prolonged) connection with any client.

## Getting Started

Getting started with Nodal is easy.

1. Download and install the newest Node 6.x version from [nodejs.org](https://nodejs.org)
2. Open terminal, and type `npm install nodal -g`.
(If you get an error, run `sudo npm install nodal -g` or fix permissions permanently by
  [following these directions](https://docs.npmjs.com/getting-started/fixing-npm-permissions)
3. Using your terminal, visit your projects folder. Perhaps with `cd ~`.
4. Run `nodal new`.
5. Follow the on screen instructions, enter your new project directory and type `nodal s`.

That's it! Your Nodal webserver is up and running.

## Hooking Up Your Database

Once Nodal is up and running, it's likely that you'll want to connect your project
to a database. Nodal comes packaged with Migrations, a Query Composer and full
PostgreSQL integration.

First you'll need to install PostgreSQL. OS X users, I recommend using
[Postgres.app](http://postgresapp.com/) for your development environment.

Once you've installed Postgres, make sure to run:

```
$ createuser postgres -s
```

To create a default postgres superuser with no password. (Default for Nodal's
configuration.)

To begin using your database, start with:

```
$ nodal db:create
```

To create the database and then,

```
$ nodal db:prepare
```

To prepare for migrations.

From here, `nodal db:migrate` runs all pending migrations and `nodal db:rollback`
will roll back migrations, one at a time by default.

## Server Types

Nodal works best when you follow its ideology, and that means creating a new
service to solve specific *Problem Domains* of your application and business.

The main three suggestions are **Branding Server**, **API Server** and **Application Server**.

Nodal's core competency is building API servers. We do, however, also have a
project called
[dotcom](http://github.com/keithwhor/dotcom) for building Branding Servers
(search engine optimized server-generated pages). More on this soon.

### API Server

Create an API server using Nodal's Models, PostgreSQL integration, built-in JSON
API formatting, and Query Composer (ORM). Bi-directional migrations are packaged
with Nodal, meaning you can maintain the integrity of your data.
User (including password) and OAuth AccessToken models and controllers are
pre-built for you and can be added easily to your project.

Packaged with Nodal are workers, scheduling modules, and much more for all of
your data needs.

We can look at what an API Controller might look like for, say, blog posts:

```javascript
class BlogPostsController extends Nodal.Controller {

  index() {

    BlogPost.query()
      .join('user')
      .join('comments')
      .where(this.params.query)
      .end((err, blogPosts) => {

        this.respond(err || blogPosts);

      });

  }

  show() {

    BlogPost.find(this.params.route.id, (err, blogPost) => this.respond(err || blogPost));

  }

  create() {

    BlogPost.create(params.body, (err, blogPost) => this.respond(err || blogPost));

  }

  update() {

    BlogPost.update(this.params.route.id, params.body, (err, blogPost) => this.respond(err || blogPost));

  }

  destroy() {

    BlogPost.destroy(this.params.route.id, (err, blogPost) => this.respond(err || blogPost));

  }

}
```

## Deploying to Polybit

The following commands are available for [Polybit](http://polybit.com) API deployment.

(You can view them any time with `nodal help poly`.)

```
poly:create [project]
	Creates a new, empty project

poly:db:assign [database] [project]
	Assigns a database to a project

poly:db:create [name]
	Creates a new database

poly:db:drop [db]
	Destroys a database

poly:db:list
	Retrieves a list of all available Polybit databases for current user

poly:deploy [project]
	Deploys current directory as a Nodal project

poly:env [project]
	-r                   [key] Removes an environment variable
	-s                   [key] [value] Sets an environment variable
	--remove             [key] Removes an environment variable
	--set                [key] [value] Sets an environment variable

	Retrieves, sets or removes environment variables for a project

poly:list
	Retrieves a list of all available Polybit projects for current user

poly:login
	Logs in to Polybit API server

poly:logout
	Logs in to Polybit API server

poly:register
	Registers a new Polybit User Account (Required for Deployment)

poly:remove [project]
	Removes a project

poly:run [project] [command]
	Runs a Nodal command on your deployed project
```

## Beginner's Guide

You'll be able to learn more about Nodal at [nodaljs.com](http://nodaljs.com).

## Documentation

Check out the website at [nodaljs.com](http://nodaljs.com).

## Roadmap

View the roadmap at [ROADMAP.md](./ROADMAP.md).

## About

Nodal is under active development and maintained by
[Keith Horwood](http://keithwhor.com).

**Contributors welcome!**

Follow me on Twitter, [@keithwhor](http://twitter.com/keithwhor)

Fork me on GitHub, [keithwhor](http://github.com/keithwhor)

Thanks for checking out Nodal!

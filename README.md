# Nodal
## API Services Made Easy with Node.js

[![Build Status](https://travis-ci.org/keithwhor/nodal.svg?branch=master)](https://travis-ci.org/keithwhor/nodal) [![Join the chat at https://gitter.im/keithwhor/nodal](https://badges.gitter.im/keithwhor/nodal.svg)](https://gitter.im/keithwhor/nodal?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

![Nodal Logo](./nodal.png)

View the website at [nodaljs.com](http://nodaljs.com).

Nodal is a web server and opinionated framework for building API services in
Node.js as part of a larger, service-oriented stack for web, mobile or IoT apps.

Boasting its own opinionated, explicit, idiomatic and highly-extensible
full-service framework, Nodal takes care of all of the hard decisions for you
and your team. This allows you to focus on creating an effective product in a
short timespan while minimizing technical debt.

Nodal projects are ready to deploy to [Heroku](https://heroku.com) right out of
the box, so you can have your website live in no time.

[Check out the first Nodal Screencast here.](https://www.youtube.com/embed/IxBXkFbUqtk)

## Why Nodal?

Nodal is built upon an ideology of a robust, scalable microservice architecture.
Specialized for building distributed, scalable APIs, use Nodal to interface
with your database effortlessly.

Nodal servers are not meant to be monoliths. They're meant to service your needs
of interfacing with your data layer effortlessly. While you can output any
data format with Nodal, it's recommended you offload things like static
page rendering to other optimized services like CDNs.

Within the context of building APIs, Nodal should never feel restrictive.
But Nodal is not a silver bullet. It is meant as an entry point into distributed,
modern web architectures.

## Getting Started

Getting started with Nodal is easy.

1. Download and install the newest Node 5.x version from [nodejs.org](https://nodejs.org)
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

Nodal's core competency is building API servers. Though we do have
[dotcom](http://github.com/keithwhor/dotcom) for building Branding Servers
(search engine optimized server-generated pages).

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

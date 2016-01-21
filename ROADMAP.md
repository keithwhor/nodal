# Nodal Roadmap

### Legend:

:x: Not Started
:hourglass: WIP
:white_check_mark: Complete

### 0.6, Target: 01/25/2016

### Bugs
* :white_check_mark: ModelArray .destroyAll
* :white_check_mark: ModelArray .saveAll must ensure inherited save methods are obeyed (e.g. `User#save`)
* :white_check_mark: Model#destroyCascade should cascade
* :white_check_mark: Model#destroy should not show validation errors
* :white_check_mark: Model.joinsTo needs to be rethought, or all models need to be `required` on app start

### Features
* :x: Use environment variables exclusively for app settings
* :x: groupBy for Composer
* :hourglass: Idiomatic tests in app (using mocha)
* :hourglass: Refactor tasks
* :hourglass: Strong parameter support
* :white_check_mark: Postgres JSON datatype support
* :white_check_mark: Refactor Middleware, add Renderware
* :white_check_mark: Nested template hierarchy (parents w/ children)
* :white_check_mark: Composer `.first()` support
* :white_check_mark: Joining in multiply-nested models
* :white_check_mark: Add updated_at support like existing created_at

### Nice-to-haves
* :x: More meaningful errors

### 0.7, Target: Late Q1 2016

### Features
* :x: GraphQL Support
* :x: Automatic document generator + formatter for producing docs on [nodaljs.com](http://nodaljs.com)
* :x: Implement hardcoded security features such as (CSP Headers and Blocking sensitive fields)
* :hourglass: HTTPS support (including CLI certificate verification/generation)
* :hourglass: WebSocket support
* :hourglass: Clustering of processes (multiple cores, threads)
* :hourglass: Docker integration

### 1.0, Target: Q2 2016

### Features
* :x: MySQL support
* :hourglass: Comprehensive test suite

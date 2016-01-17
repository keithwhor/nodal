# Nodal Roadmap

### Legend:

:x: Not Started
:hourglass: WIP
:white_check_mark: Complete

### 0.6, Target: 01/25/2016

### Bugs
* :x: ModelArray .destroyAll
* :x: ModelArray .saveAll must ensure inherited save methods are obeyed (e.g. `User#save`)
* :x: Model#destroy should cascade
* :x: Model#destroy should not show validation errors
* :x: Model.joinsTo needs to be rethought, or all models need to be `required` on app start

### Features
* :hourglass: Idiomatic tests in app (using mocha)
* :white_check_mark: Nested template hierarchy (parents w/ children)
* :x: Use environment variables exclusively for app settings
* :x: groupBy for Composer
* :x: Refactor tasks
* :x: Strong parameter support
* :x: Postgres JSON datatype support
* :white_check_mark: Composer `.first()` support
* :x: Joining in multiply-nested models
* :white_check_mark: Add updated_at support like existing created_at

### Nice-to-haves
* :x: More meaningful errors

### 0.7, Target: Late Q1 2016

### Features
* :hourglass: WebSocket support
* :hourglass: Clustering of processes (multiple cores, threads)
* :hourglass: Docker integration
* :x: GraphQL Support
* :x: Automatic document generator + formatter for producing docs on [nodaljs.com](http://nodaljs.com)

### 1.0, Target: Q2 2016

### Features
* :hourglass: Comprehensive test suite
* :x: MySQL support

#### How to create and use CLI commands
Create a new js file in `cli/commands`. Create a new command from the passed `Command` class to the `module.exports`. `Command` constructor arguments are ({String} name, {Object} options, {Function} callback)
```javascript
module.exports = function(Command) {
  new Command("s", null, (args, flags, callback) => {
    ... do something ...
    callback();
    // or
    // callback(new Error("some Error"));
  }, "Start the Nodal server based on the current project");
};
```
This will automatically add the command to the CLI & help function, etc. If you want the command to be hidden you can pass `{ hidden: true }` to options.

#### Extended Classes
For defining commands like 'db:migrate' an extended class should be used. CLI `Command` automatically derives the last argument as a prefix from the extended class so creation of these classes is rather easy:
```javascript
module.exports = function(Command) {
  class DBCommand extends Command {
    constructor(name, options, fn, def) {
      super(name, options, fn, def, 'db');
    }
  }
  new DBCommand("migrate", null, (args, flags, callback) => {
  ...
};
```

#### Describing Extensions
A CLI command could have multiple arguments and flags. Extensions `ext` are a part of the options in `Command` and are parsed with their definition after a hashtag `#`.
```javascript
new GeneratorCommand("model <path_to_model>", {
    ext: ["--<access_token> #Add a new access_token model", "--<user> #Add a new user model from a built-in generator"]
  }, (args, flags, callback) => {
    interfaceDBCommands.model(args, flags, callback);
  }, "Add a new model");
```
Note that you can still path the `_base_` argument as model name and `Command` will parse it for you to the initial ext. This is useful when the command only takes one argument and that way you won't need to define `ext` for every command.

#### Order of Commands
Commands can be ordered based on `options.order`. Order refers to the order of appearance in the `nodal help` output and it is an ascending order. Note that negative orders are not allowed and an order of `-1` is reserved for the help command.
```javascript
new Command("new", { order: 2 }, (args, flags, callback) => {
```
Furthermore an extended class can set a class order to keep anything under that class under the same order. There is no way to arrange elements under a class order but it can be described by using a type of algorithm such as log or range. Since the implementation is under the `commands` folder the choice and the implementation of grouped or extended orders are left to the developer. If order is defined after `super` constructor is called you should set the internal member `_order`.
```javascript
class DBCommand extends Command {
  constructor(name, options, fn, def) {
    super(name, options, fn, def, 'db');
    this._order = 3;
  }
}
```

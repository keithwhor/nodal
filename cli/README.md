#### How to create and use CLI commands
Create a new js file in `cli/commands`. Create a new command from the passed `Command` class to the `module.exports`. `Command` constructor arguments are ({String} prefix/group, {String} name, {Object} options, {Function} callback). You should pass the command description as the `definition` property under `options`.
```javascript
module.exports = function(Command) {
  new Command(null, "s", {
    definition: "Start the Nodal server based on the current project"
  }, (args, flags, callback) => {
    ... do something ...
    callback();
    // or
    // callback(new Error("some Error"));
  });
};
```
This will automatically add the command to the CLI & help function, etc. If you want the command to be hidden you can pass `{ hidden: true }` to options. To order an item set `{ order: x }` where `x` is any positive integer.

#### Extended Classes
For defining commands like 'db:migrate' an extended class should be used. CLI `Command` automatically derives the first argument as a prefix but for *ease of use* you can define these classes in a separate file and `require` them as extended classes:
```javascript

module.exports = (function() {
  ...
  const Command = require('./command.js');
  
  class GenerateCommand extends Command {

    constructor(name, options, fn) {
      super('g', name, options, fn);
      // Group order
      this._order = 20;
    }

  }
  
  return GenerateCommand;
})();
```

#### Describing Extensions
A CLI command could have multiple arguments and params.flags. Extensions `ext` are a part of the options in `Command` and are parsed with their definition after a hashtag `#`.
```javascript
new Command(null, "model <path_to_model>", {
    definition: "Add a new model",
    ext: ["--<access_token> #Add a new access_token model", "--<user> #Add a new user model from a built-in generator"]
  }, (args, flags, callback) => {
    interfaceDBCommands.model(args, flags, callback);
  });
```
Note that you can still path the `_base_` argument as model name and `Command` will parse it for you to the first ext. This is useful when the command only takes one argument and that way you won't need to define `ext` for every command.

#### Order of Commands
Commands can be ordered based on `options.order`. Order refers to the order of appearance in the `nodal help` output and it is an ascending order. Note that negative orders are not allowed and an order of `-1` is reserved for the help command.
```javascript
new Command(null, "new", { order: 2, ... }, (args, flags, callback) => {
```
Furthermore an extended class can set a class order to keep anything under that class under the same order. There is no way to arrange elements under a class order but it can be described by using a type of algorithm such as log or range. Since the implementation is under the `commands` folder the choice and the implementation of grouped or extended orders are left to the developer. If order is defined after `super` constructor is called you should set the internal member `_order`.
```javascript
class DBCommand extends Command {
  constructor(name, options, fn, def) {
    super("db", name, options, fn, def);
    this._order = 3;
  }
}
```

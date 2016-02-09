module.exports = (() => {

  return {
    name: process.env.NODE_ENV || 'production',
    rootDirectory: process.cwd()
  };

})();

'use strict';

const path = require('path');
const fs = require('fs');
const FILENAME = '.polybit';

function readCredentials() {

  let cred = '';

  try {
    cred = fs.readFileSync(path.join(process.cwd(), '.polybit')).toString();
  } catch (e) {
    cred = '';
  }

  return cred
    .split('\n')
    .filter(v => v)
    .map(l => l.split('='))
    .reduce((p, c) => { return (p[c[0]] = c[1]), p; }, {})

}

function writeCredentials(obj) {

  let str = Object.keys(obj).map(k => `${k}=${obj[k]}`).join('\n') + '\n';
  fs.writeFileSync(path.join(process.cwd(), '.polybit'), str);

}

module.exports = {

  read: (key) => {

    return readCredentials()[key];

  },

  write: (key, value) => {

    let cred = readCredentials();
    cred[key] = value;
    writeCredentials(cred);
    return true;

  }

};

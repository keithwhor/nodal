'use strict';

module.exports = (fields, objects) => {

  let sizes = fields.map(f => {
    let rowSizes = [f.length].concat(objects.map(o => o[f].toString().length));
    return Math.max.apply(null, rowSizes);
  });

  return [
    fields.map((f, i) => ' ' + f + Array(sizes[i] - f.length + 1).join(' ') + ' ').join('|'),
    fields.map((f, i) => Array(sizes[i] + 3).join('-')).join('|')
  ].concat(
    objects.map(o => {
      return fields.map((f, i) => {
        let val = o[f].toString();
        return ' ' + val + Array(sizes[i] - val.length + 1).join(' ') + ' '
      }).join('|')
    })
  ).join('\n');

};

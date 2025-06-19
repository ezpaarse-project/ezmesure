const r5Transformer = require('./r5');
const r51Transformer = require('./r51');

module.exports = new Map([
  ['5', r5Transformer],
  ['5.1', r51Transformer],
]);

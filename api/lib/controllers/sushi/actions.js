const counter = require('../../utils/counter.json');

exports.getAll = async (ctx) => {
  ctx.type = 'json';
  ctx.status = 200;
  ctx.body = counter;
};

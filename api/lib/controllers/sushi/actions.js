const counter = require('../../utils/sushi.json');

exports.getAll = async (ctx) => {
  ctx.type = 'json';
  ctx.status = 200;
  ctx.body = counter;
};

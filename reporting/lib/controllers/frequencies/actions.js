const { frequencies } = require('config');

exports.getAll = async (ctx) => {
  ctx.body = frequencies;
};

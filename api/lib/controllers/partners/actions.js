const Institution = require('../../models/Institution');

exports.list = async (ctx) => {
  ctx.type = 'json';
  ctx.body = await Institution.findAllValidated();
};

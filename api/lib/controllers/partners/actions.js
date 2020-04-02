const path = require('path');
const fs = require('fs');
const depositors = require('../../services/depositors');

exports.list = async function (ctx) {
  ctx.type = 'json';
  ctx.body = await depositors.getFromIndex();
};

exports.refresh = async function (ctx) {
  ctx.type = 'json';

  const result = await depositors.update();

  ctx.status = result.errors ? 500 : 200;
  ctx.body = result;
};

exports.pictures = async function (ctx) {
  ctx.type = 'image/png';
  ctx.status = 200;

  const { id } = ctx.params;
  if (id) {
    const logo = fs.createReadStream(path.resolve(__dirname, '..', '..', '..', 'uploads', `${id}.png`));
    ctx.body = logo;
    return ctx;
  }

  ctx.status = 400;
  return ctx;
};

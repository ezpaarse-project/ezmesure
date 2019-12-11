const providers = require('../../services/providers');

exports.check = async function (ctx) {
  ctx.type = 'json';
  ctx.body = await providers.check();
};

exports.list = async function (ctx) {
  ctx.type = 'json';
  ctx.body = await providers.list();
};

exports.find = async function (ctx) {
  const { providerName } = ctx.request.params;
  ctx.type = 'json';
  ctx.body = await providers.list(providerName);
};

exports.del = async function (ctx) {
  const { providerName } = ctx.request.params;
  ctx.type = 'json';
  ctx.body = await providers.remove(providerName);
};

exports.register = async function (ctx) {
  const { providerName } = ctx.request.params;
  const options = ctx.request.body;
  const mandatory = ['key', 'condition', 'target', 'field'];

  ctx.type = 'json';

  if (mandatory.some((p) => !options[p])) {
    ctx.status = 400;
    return ctx.body = {
      error: `mandatory field missing, you must specify: ${mandatory.join(', ')}`,
    };
  }

  options.name = providerName;
  ctx.body = await providers.register(providerName, options);
};

exports.load = async function (ctx) {
  const { providerName } = ctx.request.params;
  ctx.type = 'json';
  ctx.body = await providers.load(providerName, ctx.request.body);
};

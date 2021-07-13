const kibana = require('../../services/kibana');

exports.listRoles = async (ctx) => {
  let { data } = await kibana.getRoles();

  if (!Array.isArray(data)) {
    data = [];
  }

  if (!ctx.query.reserved) {
    // eslint-disable-next-line no-underscore-dangle
    data = data.filter((role) => !(role && role.metadata && role.metadata._reserved));
  }

  ctx.status = 200;
  ctx.body = data;
};

exports.getRole = async (ctx) => {
  const { roleName: name } = ctx.request.params;

  const { data, status } = await kibana.getRole(name);

  if (status === 404) {
    ctx.throw(404, ctx.$t('errors.role.notFound', name));
  }

  ctx.status = 200;
  ctx.body = data;
};

exports.createRole = async (ctx) => {
  const { roleName: name } = ctx.request.params;
  const { body = {} } = ctx.request;

  await kibana.putRole({ name, body });

  ctx.status = 204;
};

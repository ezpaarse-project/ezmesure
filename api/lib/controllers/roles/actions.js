const kibana = require('../../services/kibana');

exports.createRole = async (ctx) => {
  const { roleName: name } = ctx.request.params;
  const { body = {} } = ctx.request;

  await kibana.putRole({ name, body });

  ctx.status = 204;
};

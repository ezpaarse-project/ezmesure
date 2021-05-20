const kibana = require('../../services/kibana');

exports.listDashboards = async (ctx) => {
  const { space } = ctx.request.query;
  const { data } = await kibana.findObjects({
    spaceId: space,
    type: 'dashboard',
    perPage: 1000,
  });
  let dashboards = data && data.saved_objects;

  if (!Array.isArray(dashboards)) {
    dashboards = [];
  }

  ctx.status = 200;
  ctx.body = dashboards;
};


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

exports.exportDashboard = async (ctx) => {
  const { query = {} } = ctx.request;
  const { space: spaceId, dashboard: dashboardId } = query;

  const { status } = await kibana.getObject({
    type: 'dashboard',
    id: dashboardId,
    spaceId,
  });

  if (status === 404) {
    ctx.throw(404, 'dashboard not found');
  }

  const { data } = await kibana.exportDashboard({
    dashboardId,
    spaceId,
  });

  if (!data || !data.version || !Array.isArray(data.objects)) {
    ctx.throw(500, 'failed to export dashboard');
  }

  ctx.status = 200;
  ctx.body = data;
};


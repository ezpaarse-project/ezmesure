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

exports.importDashboard = async (ctx) => {
  const { query = {}, body } = ctx.request;
  const { space: spaceId, force } = query;

  const { status } = await kibana.getSpace(spaceId);

  if (status === 404) {
    ctx.throw(404, 'space not found');
  }

  const { data } = await kibana.importDashboard({
    data: body,
    spaceId,
    force,
  });

  if (!data || !Array.isArray(data.objects)) {
    ctx.throw(500, 'failed to import dashboard');
  }

  ctx.status = 200;
  ctx.body = data;
};

exports.copyDashboard = async (ctx) => {
  const { body = {}, query = {} } = ctx.request;
  const { force } = query;
  const { source, target } = body;

  const { status } = await kibana.getObject({
    type: 'dashboard',
    id: source.dashboard,
    spaceId: source.space,
  });

  if (status === 404) {
    ctx.throw(404, 'dashboard not found');
  }

  const { data } = await kibana.exportDashboard({
    dashboardId: source.dashboard,
    spaceId: source.space,
  });

  if (!data || !data.version || !Array.isArray(data.objects)) {
    ctx.throw(500, 'failed to export dashboard');
  }

  const { data: importResponse } = await kibana.importDashboard({
    data,
    spaceId: target.space,
    force,
  });

  if (!importResponse || !Array.isArray(importResponse.objects)) {
    ctx.throw(500, 'failed to import dashboard');
  }

  ctx.body = importResponse;
};

const kibana = require('../../services/kibana');

const DEFAULT_SPACE = 'default';

/**
 * Find an index pattern with the given title
 * @param {String} spaceId ID of the space to look into
 * @param {String} patternTitle title of the pattern to find
 * @returns the matching index pattern
 */
async function findIndexPattern(spaceId, patternTitle) {
  const { data: patternsData } = await kibana.findObjects({
    spaceId,
    type: 'index-pattern',
    perPage: 1000,
  });

  const patterns = patternsData && patternsData.saved_objects;

  if (!Array.isArray(patterns)) {
    return null;
  }

  return patterns.find((p) => (
    p && p.attributes && p.attributes.title === patternTitle
  ));
}

/**
 * Patches the import object in order to replace index-pattern references with the given pattern ID
 * @param {Object} importData a dashboard import object, as required by kibana
 * @param {String} patternId the ID of the index pattern that will replace the current references
 * @returns the patched import object
 */
function patchIndexPattern(importObjects, patternId) {
  return importObjects
    // Removes index-pattern objects
    .filter((obj) => obj.type !== 'index-pattern')
    // Replaces the ID of all index-pattern references with the requested one
    .map((obj) => ({
      ...obj,
      references: !Array.isArray(obj.references) ? obj.references : obj.references.map((ref) => ({
        ...ref,
        id: ref.type === 'index-pattern' ? patternId : ref.id,
      })),
    }));
}

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

  const dashboardIds = Array.isArray(dashboardId) ? dashboardId : [dashboardId];

  for (let i = 0; i < dashboardIds.length; i += 1) {
    const { status } = await kibana.getObject({ // eslint-disable-line no-await-in-loop
      type: 'dashboard',
      id: dashboardIds[i],
      spaceId,
    });

    if (status === 404) {
      ctx.throw(404, ctx.$t('errors.dashboard.notFound', dashboardIds[i]));
    }
  }

  const { data } = await kibana.exportDashboard({
    dashboardId: dashboardIds,
    spaceId,
  });

  if (!data || !data.version || !Array.isArray(data.objects)) {
    ctx.throw(409, ctx.$t('errors.dashboard.failedToExport', dashboardIds, spaceId));
  }

  ctx.status = 200;
  ctx.body = data;
};

exports.importDashboard = async (ctx) => {
  const { query = {}, body } = ctx.request;
  const {
    space: spaceId,
    force,
    'index-pattern': indexPattern,
  } = query;

  const { status } = await kibana.getSpace(spaceId || DEFAULT_SPACE);

  if (status === 404) {
    ctx.throw(409, ctx.$t('errors.space.notFound', spaceId || DEFAULT_SPACE));
  }

  if (indexPattern) {
    const pattern = await findIndexPattern(spaceId, indexPattern);

    if (!pattern || !pattern.id) {
      ctx.throw(409, ctx.$t('errors.indexPattern.notFound', indexPattern, spaceId || DEFAULT_SPACE));
    }

    body.objects = patchIndexPattern(body.objects, pattern.id);
  }

  const { data } = await kibana.importDashboard({
    data: body,
    spaceId,
    force,
  });

  if (!data || !Array.isArray(data.objects)) {
    ctx.throw(409, ctx.$t('errors.dashboard.failedToImport', spaceId));
  }

  ctx.status = 200;
  ctx.body = data;
};

exports.copyDashboard = async (ctx) => {
  const { body = {}, query = {} } = ctx.request;
  const { force } = query;
  const { source = {}, target = {} } = body;

  const sourceDashboards = Array.isArray(source.dashboard) ? source.dashboard : [source.dashboard];

  for (let i = 0; i < sourceDashboards.length; i += 1) {
    const { status } = await kibana.getObject({ // eslint-disable-line no-await-in-loop
      type: 'dashboard',
      id: sourceDashboards[i],
      spaceId: source.space,
    });

    if (status === 404) {
      ctx.throw(404, ctx.$t('errors.dashboard.notFound', sourceDashboards[i]));
    }
  }

  const { status: spaceStatus } = await kibana.getSpace(target.space || DEFAULT_SPACE);

  if (spaceStatus === 404) {
    ctx.throw(409, ctx.$t('errors.space.notFound', target.space || DEFAULT_SPACE));
  }

  const { data: dashboard } = await kibana.exportDashboard({
    dashboardId: sourceDashboards,
    spaceId: source.space,
  });

  if (!dashboard || !dashboard.version || !Array.isArray(dashboard.objects)) {
    ctx.throw(409, ctx.$t('errors.dashboard.failedToExport', sourceDashboards, source.space || DEFAULT_SPACE));
  }

  if (target.indexPattern) {
    const pattern = await findIndexPattern(target.space, target.indexPattern);

    if (!pattern || !pattern.id) {
      ctx.throw(409, ctx.$t('errors.indexPattern.notFound', target.indexPattern, target.space || DEFAULT_SPACE));
    }

    dashboard.objects = patchIndexPattern(dashboard.objects, pattern.id);
  }

  const { data: importResponse } = await kibana.importDashboard({
    data: dashboard,
    spaceId: target.space,
    force,
  });

  if (!importResponse || !Array.isArray(importResponse.objects)) {
    ctx.throw(409, ctx.$t('errors.dashboard.failedToImport', target.space || DEFAULT_SPACE));
  }

  ctx.body = importResponse;
};

const kibana = require('../../services/kibana');
const DashboardsService = require('../../entities/dashboard.service');

/** @typedef {import('@prisma/client').Prisma.DashboardCreateInput} DashboardCreateInput */

const { schema, includableFields, adminImportSchema } = require('../../entities/dashboard.dto');
const { prepareStandardQueryParams } = require('../../services/std-query');

const standardQueryParams = prepareStandardQueryParams({
  schema,
  includableFields,
  queryFields: ['id', 'sourceDashboardId', 'sourceSpaceId'],
});
exports.standardQueryParams = standardQueryParams;

exports.getAll = async (ctx) => {
  const prismaQuery = standardQueryParams.getPrismaManyQuery(ctx);

  const dashboardsService = new DashboardsService();

  ctx.type = 'json';
  ctx.status = 200;
  ctx.set('X-Total-Count', await dashboardsService.count({ where: prismaQuery.where }));
  ctx.body = await dashboardsService.findMany(prismaQuery);
};

exports.getOne = async (ctx) => {
  const { id } = ctx.params;

  const prismaQuery = standardQueryParams.getPrismaOneQuery(ctx, { id });

  const dashboardsService = new DashboardsService();
  const dashboard = await dashboardsService.findUnique(prismaQuery);

  if (!dashboard) {
    ctx.throw(404, ctx.$t('errors.dashboard.notFound'));
    return;
  }

  ctx.status = 200;
  ctx.body = dashboard;
};

exports.createOne = async (ctx) => {
  const { body } = ctx.request;

  const dashboardService = new DashboardsService();

  if (body.id) {
    const existingDashboard = await dashboardService.findUnique({ where: { id: body.id } });

    if (existingDashboard) {
      ctx.throw(409, ctx.$t('errors.dashboard.alreadyExists', body.id));
    }
  }

  const space = await kibana.getSpace(body.sourceSpaceId);

  if (!space) {
    ctx.throw(404, ctx.$t('errors.space.notFound', body.sourceSpaceId));
    return;
  }

  const kibanaExport = await kibana.exportObjects({
    spaceId: body.sourceSpaceId,
    includeReferencesDeep: true,
    excludeExportDetails: true,
    objects: [
      {
        id: body.sourceDashboardId,
        type: 'dashboard',
      },
    ],
  });

  if (!kibanaExport) {
    ctx.throw(404, ctx.$t('errors.dashboard.notFound', body.sourceDashboardId));
    return;
  }

  const exportObjects = kibanaExport.split('\n').map((line) => JSON.parse(line));
  const dashboardObject = exportObjects.find((o) => o.type === 'dashboard' && o.id === body.sourceDashboardId);

  const tags = new Map(exportObjects.filter((o) => o.type === 'tag').map((o) => [o.id, o]));
  const dashboardTags = dashboardObject.references
    .filter((r) => r.type === 'tag')
    .map((r) => tags.get(r.id))
    .filter((x) => x);

  const dashboard = await dashboardService.create({
    data: {
      ...body,
      name: dashboardObject?.attributes?.title ?? null,
      description: dashboardObject?.attributes?.description ?? null,
      kibanaVersion: dashboardObject.coreMigrationVersion ?? null,
      data: exportObjects,
      tags: dashboardTags,
    },
  });
  ctx.type = 'json';
  ctx.status = 201;
  ctx.body = dashboard;
};

exports.upsertOne = async (ctx) => {
  const { id } = ctx.params;
  const { body } = ctx.request;

  const dashboardCreateData = { ...body, collectionId: undefined };
  const dashboardUpdateData = { ...body, collectionId: undefined };

  const { upserted, existing } = await DashboardsService.$transaction(async (service) => {
    if (body.id && body.id !== id) {
      const conflict = await service.findUnique({ where: { id: body.id } });
      if (conflict) {
        ctx.throw(409, ctx.$t('errors.dashboard.alreadyExists', body.id));
      }
    }

    const existingDashboard = await service.findUnique({ where: { id } });

    if ('collectionId' in body && body.collectionId !== existingDashboard.collectionId) {
      if (body.collectionId !== null) {
        dashboardUpdateData.collection = { connect: { id: body.collectionId } };
        dashboardCreateData.collection = { connect: { id: body.collectionId } };
      } else {
        dashboardUpdateData.collection = { disconnect: true };
      }
    }

    const upsertedDashboard = await service.upsert({
      where: { id },
      create: { ...dashboardCreateData },
      update: { ...dashboardUpdateData },
    });

    return {
      existing: existingDashboard,
      upserted: upsertedDashboard,
    };
  });

  ctx.status = existing ? 200 : 201;
  ctx.body = upserted;
};

exports.deleteOne = async (ctx) => {
  const { id } = ctx.params;

  const dashboardsService = new DashboardsService();
  await dashboardsService.delete({ where: { id } });

  ctx.status = 204;
};

exports.importMany = async (ctx) => {
  const { body = [] } = ctx.request;
  const { overwrite } = ctx.query;

  const response = {
    errors: 0,
    conflicts: 0,
    created: 0,
    items: [],
  };

  const addResponseItem = (data, status, message) => {
    if (status === 'error') { response.errors += 1; }
    if (status === 'conflict') { response.conflicts += 1; }
    if (status === 'created') { response.created += 1; }

    response.items.push({
      status,
      message,
      data,
    });
  };

  /**
   * @param {DashboardsService} dashboardsService
   * @param {*} dashboardData
   */
  const importItem = async (dashboardsService, dashboardData = {}) => {
    const { value: item, error } = adminImportSchema.validate(dashboardData);

    if (error) {
      addResponseItem(item, 'error', error.message);
      return;
    }

    if (item.id) {
      const dashboard = await dashboardsService.findUnique({ where: { id: item.id } });

      if (dashboard && !overwrite) {
        addResponseItem(item, 'conflict', ctx.$t('errors.dashboard.alreadyExists', dashboard.id));
        return;
      }
    }

    /** @type {DashboardCreateInput} */
    const data = { ...item };

    const dashboard = await dashboardsService.upsert({
      where: { id: item.id },
      create: data,
      update: data,
    });

    addResponseItem(dashboard, 'created');
  };

  await DashboardsService.$transaction(async (dashboardsService) => {
    for (let i = 0; i < body.length; i += 1) {
      const dashboardData = body[i] || {};

      try {
        // eslint-disable-next-line no-await-in-loop
        await importItem(dashboardsService, dashboardData);
      } catch (e) {
        addResponseItem(dashboardData, 'error', e.message);
      }
    }
  });

  ctx.type = 'json';
  ctx.body = response;
};

exports.refreshOne = async (ctx) => {
  const { id } = ctx.params;

  const dashboardsService = new DashboardsService();
  const dashboard = await dashboardsService.findUnique({ where: { id } });

  if (!dashboard) {
    ctx.throw(404, ctx.$t('errors.dashboard.notFound'));
    return;
  }

  if (!dashboard.sourceDashboardId) {
    ctx.throw(409, ctx.$t('errors.dashboard.noSourceDashboard'));
    return;
  }

  const space = await kibana.getSpace(dashboard.sourceDashboardId);

  if (!space) {
    ctx.throw(404, ctx.$t('errors.space.notFound', dashboard.sourceDashboardId));
    return;
  }

  const kibanaExport = await kibana.exportObjects({
    spaceId: dashboard.sourceSpaceId,
    includeReferencesDeep: true,
    excludeExportDetails: true,
    objects: [
      {
        id: dashboard.sourceDashboardId,
        type: 'dashboard',
      },
    ],
  });

  if (!kibanaExport) {
    ctx.throw(404, ctx.$t('errors.dashboard.notFound', dashboard.sourceDashboardId));
    return;
  }

  const exportObjects = kibanaExport.split('\n').map((line) => JSON.parse(line));
  const dashboardObject = exportObjects.find((o) => o.type === 'dashboard' && o.id === dashboard.sourceDashboardId);

  const tags = new Map(exportObjects.filter((o) => o.type === 'tag').map((o) => [o.id, o]));
  const dashboardTags = dashboardObject.references
    .filter((r) => r.type === 'tag')
    .map((r) => tags.get(r.id))
    .filter((x) => x);

  ctx.type = 'json';
  ctx.status = 200;
  ctx.body = await dashboardsService.update({
    where: { id },
    data: {
      name: dashboardObject?.attributes?.title ?? null,
      description: dashboardObject?.attributes?.description ?? null,
      kibanaVersion: dashboardObject.coreMigrationVersion ?? null,
      data: exportObjects,
      tags: dashboardTags,
    },
  });
};

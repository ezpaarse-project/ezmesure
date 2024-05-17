const HarvestJobService = require('../../entities/harvest-job.service');
const { harvestQueue } = require('../../services/jobs');

/** @typedef {import('@prisma/client').Prisma.HarvestJobWhereInput} HarvestJobWhereInput */

const { schema, includableFields } = require('../../entities/harvest-job.dto');
const { stringOrArray } = require('../../services/utils');
const { prepareStandardQueryParams } = require('../../services/std-query');
const { queryToPrismaFilter } = require('../../services/std-query/prisma-query');

const standardQueryParams = prepareStandardQueryParams({
  schema,
  includableFields,
  queryFields: [],
});
exports.standardQueryParams = standardQueryParams;

exports.getAll = async (ctx) => {
  const {
    endpointId,
    institutionId,
    tags,
    packages,
  } = ctx.query;

  const prismaQuery = standardQueryParams.getPrismaManyQuery(ctx);

  if (institutionId || endpointId || tags || packages) {
    prismaQuery.where.credentials = {
      endpointId: queryToPrismaFilter(endpointId),
      institutionId: queryToPrismaFilter(institutionId),
      tags: tags && { hasSome: stringOrArray(tags) },
      packages: packages && { hasSome: stringOrArray(packages) },
    };
  }

  const harvestJobService = new HarvestJobService();

  ctx.type = 'json';
  ctx.status = 200;
  ctx.set('X-Total-Count', await harvestJobService.count({ where: prismaQuery.where }));
  ctx.body = await harvestJobService.findMany(prismaQuery);
};

exports.getAllMeta = async (ctx) => {
  const {
    endpointId,
    institutionId,
    tags,
    packages,
  } = ctx.query;

  const prismaQuery = standardQueryParams.getPrismaManyQuery(ctx);

  if (institutionId || endpointId || tags || packages) {
    prismaQuery.where.credentials = {
      endpointId: queryToPrismaFilter(endpointId),
      institutionId: queryToPrismaFilter(institutionId),
      tags: tags && { hasSome: stringOrArray(tags) },
      packages: packages && { hasSome: stringOrArray(packages) },
    };
  }

  const harvestJobService = new HarvestJobService();

  const jobs = await harvestJobService.findMany({
    ...prismaQuery,
    include: {
      credentials: {
        include: {
          endpoint: true,
          institution: true,
        },
      },
    },
  });

  const data = {
    sessionIds: new Set(),
    vendors: new Map(),
    institutions: new Map(),
    reportTypes: new Set(),
    statuses: new Set(),
    tags: new Set(),
    packages: new Set(),
  };

  // eslint-disable-next-line no-restricted-syntax
  for (const job of jobs) {
    data.sessionIds.add(job.sessionId);
    data.reportTypes.add(job.reportType);
    data.statuses.add(job.status);
    data.vendors.set(job.credentials.endpointId, job.credentials.endpoint);
    data.institutions.set(job.credentials.institutionId, job.credentials.institution);
    // eslint-disable-next-line no-restricted-syntax
    for (const tag of job.credentials.tags) {
      data.tags.add(tag);
    }
    // eslint-disable-next-line no-restricted-syntax
    for (const pkg of job.credentials.packages) {
      data.packages.add(pkg);
    }
  }

  ctx.type = 'json';
  ctx.status = 200;
  ctx.body = {
    sessionIds: Array.from(data.sessionIds),
    vendors: Array.from(data.vendors.values()),
    institutions: Array.from(data.institutions.values()),
    reportTypes: Array.from(data.reportTypes),
    statuses: Array.from(data.statuses),
    tags: Array.from(data.tags),
    packages: Array.from(data.packages),
  };
};

exports.getOne = async (ctx) => {
  const { taskId } = ctx.params;

  const prismaQuery = standardQueryParams.getPrismaOneQuery(ctx, { id: taskId });

  const harvestJobService = new HarvestJobService();
  const task = await harvestJobService.findUnique(prismaQuery);

  if (!task) {
    ctx.throw(404, ctx.$t('errors.task.notFound'));
    return;
  }

  ctx.status = 200;
  ctx.body = task;
};

exports.cancelOne = async (ctx) => {
  const { taskId } = ctx.params;

  const harvestJobService = new HarvestJobService();
  let task = await harvestJobService.findUnique({ where: { id: taskId } });
  const job = await harvestQueue.getJob(taskId);

  if (job) {
    if (await job.isActive()) {
      if (!job?.data?.pid) {
        ctx.throw(500, ctx.$t('errors.task.cannotCancelJobWithoutPID'));
      }

      process.kill(job.data.pid, 'SIGTERM');
    } else {
      await job.remove();
    }
  }

  if (!task) {
    ctx.throw(404, ctx.$t('errors.task.notFound'));
  }

  if (task && !HarvestJobService.isDone(task)) {
    task = await harvestJobService.cancel(task);
  }

  ctx.status = 200;
  ctx.body = task;
};

exports.deleteOne = async (ctx) => {
  const { taskId } = ctx.params;

  const job = await harvestQueue.getJob(taskId);

  if (job) {
    if (await job.isActive()) {
      ctx.throw(409, ctx.$t('errors.task.cannotDeleteActiveTask'));
    }

    await job.remove();
  }

  const harvestJobService = new HarvestJobService();
  await harvestJobService.delete({ where: { id: taskId } });

  ctx.status = 204;
};

const { includableFields } = require('../../entities/harvest-job.dto');
const HarvestJobService = require('../../entities/harvest-job.service');
const { harvestQueue } = require('../../services/jobs');

const { propsToPrismaSort, propsToPrismaInclude, queryToPrismaFilter } = require('../utils');

/** @typedef {import('@prisma/client').Prisma.HarvestJobWhereInput} HarvestJobWhereInput */

exports.getAll = async (ctx) => {
  ctx.type = 'json';
  ctx.status = 200;
  const { query = {} } = ctx.request;
  const {
    size,
    sort,
    order = 'asc',
    page = 1,
    id: taskIds,
    status,
    type: reportType,
    sessionId,
    credentialsId,
    endpointId,
    institutionId,
    tags,
    distinct: distinctFields,
    include: propsToInclude,
  } = query;

  /** @type {HarvestJobWhereInput} */
  const where = {
    id: queryToPrismaFilter(taskIds),
    status: queryToPrismaFilter(status),
    reportType: queryToPrismaFilter(reportType),
    sessionId: queryToPrismaFilter(sessionId),
    credentialsId: queryToPrismaFilter(credentialsId),
  };

  if (institutionId || endpointId || tags) {
    where.credentials = {
      endpointId: queryToPrismaFilter(endpointId),
      institutionId: queryToPrismaFilter(institutionId),
      tags: tags && { hasSome: queryToPrismaFilter(tags).in },
    };
  }

  let distinct;
  if (distinctFields) {
    distinct = Array.isArray(distinctFields) ? distinctFields : distinctFields.split(',').map((s) => s.trim());
  }

  const harvestJobService = new HarvestJobService();

  ctx.set('X-Total-Count', await harvestJobService.count({ where }));
  ctx.body = await harvestJobService.findMany({
    include: propsToPrismaInclude(propsToInclude, includableFields),
    where,
    distinct,
    orderBy: propsToPrismaSort(sort, order),
    take: Number.isInteger(size) && size > 0 ? size : undefined,
    skip: Number.isInteger(size) ? size * (page - 1) : undefined,
  });
};

exports.getAllMeta = async (ctx) => {
  ctx.type = 'json';
  const {
    status,
    type: reportType,
    sessionId,
    credentialsId,
    endpointId,
    institutionId,
    tags,
  } = ctx.request.query;

  const harvestJobService = new HarvestJobService();

  /** @type {HarvestJobWhereInput} */
  const where = {
    status: queryToPrismaFilter(status),
    reportType: queryToPrismaFilter(reportType),
    sessionId: queryToPrismaFilter(sessionId),
    credentialsId: queryToPrismaFilter(credentialsId),
  };

  if (institutionId || endpointId || tags) {
    where.credentials = {
      endpointId: queryToPrismaFilter(endpointId),
      institutionId: queryToPrismaFilter(institutionId),
      tags: tags && { hasSome: queryToPrismaFilter(tags).in },
    };
  }

  const jobs = await harvestJobService.findMany({
    where,
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
  }

  ctx.status = 200;
  ctx.body = {
    sessionIds: Array.from(data.sessionIds),
    vendors: Array.from(data.vendors.values()),
    institutions: Array.from(data.institutions.values()),
    reportTypes: Array.from(data.reportTypes),
    statuses: Array.from(data.statuses),
    tags: Array.from(data.tags),
  };
};

exports.getOne = async (ctx) => {
  const { taskId } = ctx.params;

  const harvestJobService = new HarvestJobService();
  const task = await harvestJobService.findUnique({
    where: { id: taskId },
    include: {
      credentials: {
        include: {
          endpoint: true,
        },
      },
    },
  });

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

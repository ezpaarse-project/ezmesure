const harvestJobService = require('../../entities/harvest-job.service');
const { harvestQueue } = require('../../services/jobs');

/** @typedef {import('@prisma/client').Prisma.HarvestJobWhereInput} HarvestJobWhereInput */

exports.getAll = async (ctx) => {
  ctx.type = 'json';
  ctx.status = 200;
  const { query = {} } = ctx.request;
  const {
    size,
    id: taskIds,
    status,
    type,
    harvestId,
    credentialsId,
    endpointId,
    institutionId,
    distinct: distinctFields,
  } = query;

  /** @type {HarvestJobWhereInput} */
  const where = {};

  if (taskIds) {
    where.id = { in: Array.isArray(taskIds) ? taskIds : taskIds.split(',').map((s) => s.trim()) };
  }
  if (status) {
    where.status = { in: Array.isArray(status) ? status : status.split(',').map((s) => s.trim()) };
  }
  if (type) {
    where.reportType = { in: Array.isArray(type) ? type : type.split(',').map((s) => s.trim()) };
  }
  if (institutionId) {
    where.institutionId = { in: Array.isArray(institutionId) ? institutionId : institutionId.split(',').map((s) => s.trim()) };
  }
  if (credentialsId) {
    where.credentialsId = { in: Array.isArray(credentialsId) ? credentialsId : credentialsId.split(',').map((s) => s.trim()) };
  }
  if (endpointId) {
    where.credentials = {
      endpointId: { in: Array.isArray(endpointId) ? endpointId : endpointId.split(',').map((s) => s.trim()) },
    };
  }
  if (harvestId) {
    where.harvestId = { in: Array.isArray(harvestId) ? harvestId : harvestId.split(',').map((s) => s.trim()) };
  }

  let distinct;
  if (distinctFields) {
    distinct = Array.isArray(distinctFields) ? distinctFields : distinctFields.split(',').map((s) => s.trim());
  }

  ctx.body = await harvestJobService.findMany({
    include: {
      credentials: {
        include: {
          endpoint: true,
        },
      },
    },
    where,
    distinct,
    take: size,
  });
};

exports.getOne = async (ctx) => {
  const { taskId } = ctx.params;

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

  if (task && !harvestJobService.isDone(task)) {
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

  await harvestJobService.delete({ where: { id: taskId } });

  ctx.status = 204;
};

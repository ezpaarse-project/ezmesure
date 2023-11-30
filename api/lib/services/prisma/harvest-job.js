// @ts-check
const { client: prisma, Prisma } = require('./index');

/* eslint-disable max-len */
/** @typedef {import('@prisma/client').HarvestJob} HarvestJob */
/** @typedef {import('@prisma/client').Prisma.HarvestJobUpdateArgs} HarvestJobUpdateArgs */
/** @typedef {import('@prisma/client').Prisma.HarvestJobUpsertArgs} HarvestJobUpsertArgs */
/** @typedef {import('@prisma/client').Prisma.HarvestJobDeleteArgs} HarvestJobDeleteArgs */
/** @typedef {import('@prisma/client').Prisma.HarvestJobFindUniqueArgs} HarvestJobFindUniqueArgs */
/** @typedef {import('@prisma/client').Prisma.HarvestJobFindFirstArgs} HarvestJobFindFirstArgs */
/** @typedef {import('@prisma/client').Prisma.HarvestJobFindManyArgs} HarvestJobFindManyArgs */
/** @typedef {import('@prisma/client').Prisma.HarvestJobCreateArgs} HarvestJobCreateArgs */
/* eslint-enable max-len */

/**
 * @param {HarvestJobCreateArgs} params
 * @returns {Promise<HarvestJob>}
 */
function create(params) {
  return prisma.harvestJob.create(params);
}

/**
 * @param {HarvestJobFindManyArgs} params
 * @returns {Promise<HarvestJob[]>}
 */
function findMany(params) {
  return prisma.harvestJob.findMany(params);
}

/**
 * @param {HarvestJobFindUniqueArgs} params
 * @returns {Promise<HarvestJob | null>}
 */
function findUnique(params) {
  return prisma.harvestJob.findUnique(params);
}

/**
 * @param {HarvestJobFindFirstArgs} params
 * @returns {Promise<HarvestJob | null>}
 */
function findFirst(params) {
  return prisma.harvestJob.findFirst(params);
}

/**
 * @param {HarvestJobUpdateArgs} params
 * @returns {Promise<HarvestJob>}
 */
function update(params) {
  return prisma.harvestJob.update(params);
}

/**
 * @param {HarvestJobUpsertArgs} params
 * @returns {Promise<HarvestJob>}
 */
function upsert(params) {
  return prisma.harvestJob.upsert(params);
}

/**
 * @param {HarvestJobDeleteArgs} params
 * @returns {Promise<HarvestJob | null>}
 */
async function remove(params) {
  let job;

  try {
    job = await prisma.harvestJob.delete(params);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return null;
    }
    throw error;
  }

  return job;
}

/**
 * @param {HarvestJob} job
 * @param {object} options
 * @param {string} [options.status=finished] - The status of the task
 * @param {string} [options.errorCode] - An error code
 * @returns {Promise<HarvestJob>}
 */
function finish(job, options = {}) {
  const { status = 'finished', errorCode } = options;
  const { startedAt, createdAt } = job;

  let runningTime;

  if (startedAt) {
    runningTime = Date.now() - startedAt.getTime();
  } else if (createdAt) {
    runningTime = Date.now() - createdAt.getTime();
  }

  return update({
    where: { id: job.id },
    data: { status, runningTime, errorCode },
  });
}

/**
 * Returns whether the job is terminated or not by checking its status
 * @param {HarvestJob} job - The job to check
 */
function isDone(job) {
  return ['finished', 'failed', 'cancelled', 'delayed'].includes(job?.status);
}

/**
 * Cancel a job
 * @param {HarvestJob} job - The job to cancel
 */
function cancel(job) {
  return update({
    where: { id: job.id },
    data: { status: 'cancelled' },
  });
}

module.exports = {
  create,
  findMany,
  findUnique,
  findFirst,
  update,
  upsert,
  remove,
  finish,
  cancel,
  isDone,
};

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
 * @returns {Promise<Array<HarvestJob> | null>}
 */
async function removeAll() {
  if (process.env.NODE_ENV !== 'dev') { return null; }

  const harvestJobs = await findMany({});

  if (harvestJobs.length === 0) { return null; }

  await Promise.all(harvestJobs.map(async (harvestJob) => {
    await remove({
      where: {
        id: harvestJob.id,
      },
    });
  }));

  return harvestJobs;
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
  cancel,
  removeAll,
};

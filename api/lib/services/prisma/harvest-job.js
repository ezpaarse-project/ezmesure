// @ts-check
const { client: prisma, Prisma } = require('./index');

/* eslint-disable max-len */
/** @typedef {import('../../.prisma/client').Prisma.TransactionClient} TransactionClient */
/** @typedef {import('../../.prisma/client').HarvestJob} HarvestJob */
/** @typedef {import('../../.prisma/client').Prisma.HarvestJobUpdateArgs} HarvestJobUpdateArgs */
/** @typedef {import('../../.prisma/client').Prisma.HarvestJobUpsertArgs} HarvestJobUpsertArgs */
/** @typedef {import('../../.prisma/client').Prisma.HarvestJobDeleteArgs} HarvestJobDeleteArgs */
/** @typedef {import('../../.prisma/client').Prisma.HarvestJobDeleteManyArgs} HarvestJobDeleteManyArgs */
/** @typedef {import('../../.prisma/client').Prisma.HarvestJobFindUniqueArgs} HarvestJobFindUniqueArgs */
/** @typedef {import('../../.prisma/client').Prisma.HarvestJobFindFirstArgs} HarvestJobFindFirstArgs */
/** @typedef {import('../../.prisma/client').Prisma.HarvestJobFindManyArgs} HarvestJobFindManyArgs */
/** @typedef {import('../../.prisma/client').Prisma.HarvestJobGroupByArgs} HarvestJobGroupByArgs */
/** @typedef {import('../../.prisma/client').Prisma.HarvestJobAggregateArgs} HarvestJobAggregateArgs */
/** @typedef {import('../../.prisma/client').Prisma.HarvestJobCountArgs} HarvestJobCountArgs */
/** @typedef {import('../../.prisma/client').Prisma.HarvestJobCreateArgs} HarvestJobCreateArgs */
/* eslint-enable max-len */

/**
 * @param {HarvestJobCreateArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<HarvestJob>}
 */
function create(params, tx = prisma) {
  return tx.harvestJob.create(params);
}

/**
 * @param {HarvestJobFindManyArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<HarvestJob[]>}
 */
function findMany(params, tx = prisma) {
  return tx.harvestJob.findMany(params);
}

/**
 * @param {HarvestJobFindUniqueArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<HarvestJob | null>}
 */
function findUnique(params, tx = prisma) {
  return tx.harvestJob.findUnique(params);
}

/**
 * @param {HarvestJobFindFirstArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<HarvestJob | null>}
 */
function findFirst(params, tx = prisma) {
  return tx.harvestJob.findFirst(params);
}

/**
 * @param {HarvestJobGroupByArgs} params
 * @param {TransactionClient} [tx]
 * @returns
 */
function groupBy(params, tx = prisma) {
  // @ts-ignore
  return tx.harvestJob.groupBy(params);
}

/**
 * @param {HarvestJobAggregateArgs} params
 * @param {TransactionClient} [tx]
 * @returns
 */
function aggregate(params, tx = prisma) {
  return tx.harvestJob.aggregate(params);
}

/**
 * @param {HarvestJobCountArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<number>}
 */
function count(params, tx = prisma) {
  return tx.harvestJob.count(params);
}

/**
 * @param {HarvestJobUpdateArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<HarvestJob>}
 */
function update(params, tx = prisma) {
  return tx.harvestJob.update(params);
}

/**
 * @param {HarvestJobUpsertArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<HarvestJob>}
 */
function upsert(params, tx = prisma) {
  return tx.harvestJob.upsert(params);
}

/**
 * @param {HarvestJobDeleteArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<HarvestJob | null>}
 */
async function remove(params, tx = prisma) {
  let job;

  try {
    job = await tx.harvestJob.delete(params);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return null;
    }
    throw error;
  }

  return job;
}

/**
 * @param {HarvestJobDeleteManyArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<{ count: number }>}
 */
function removeMany(params, tx = prisma) {
  return tx.harvestJob.deleteMany(params);
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
  groupBy,
  aggregate,
  count,
  update,
  upsert,
  remove,
  removeMany,
  cancel,
  removeAll,
};

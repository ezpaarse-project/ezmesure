// @ts-check
const harvestJobPrisma = require('../services/prisma/harvest-job');
const { triggerHooks } = require('../hooks/hookEmitter');

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

module.exports = class HarvestJobsService {
  /**
   * @param {HarvestJobCreateArgs} params
   * @returns {Promise<HarvestJob>}
   */
  static async create(params) {
    const job = await harvestJobPrisma.create(params);

    triggerHooks('harvest-job:create', job);

    return job;
  }

  /**
   * @param {HarvestJobFindManyArgs} params
   * @returns {Promise<HarvestJob[]>}
   */
  static findMany(params) {
    return harvestJobPrisma.findMany(params);
  }

  /**
   * @param {HarvestJobFindUniqueArgs} params
   * @returns {Promise<HarvestJob | null>}
   */
  static findUnique(params) {
    return harvestJobPrisma.findUnique(params);
  }

  /**
   * @param {HarvestJobFindFirstArgs} params
   * @returns {Promise<HarvestJob | null>}
   */
  static findFirst(params) {
    return harvestJobPrisma.findFirst(params);
  }

  /**
   * @param {HarvestJobUpdateArgs} params
   * @returns {Promise<HarvestJob>}
   */
  static async update(params) {
    const job = await harvestJobPrisma.update(params);

    triggerHooks('harvest-job:update', job);

    return job;
  }

  /**
   * @param {HarvestJobUpsertArgs} params
   * @returns {Promise<HarvestJob>}
   */
  static async upsert(params) {
    const job = await harvestJobPrisma.upsert(params);

    triggerHooks('harvest-job:upsert', job);

    return job;
  }

  /**
   * @param {HarvestJobDeleteArgs} params
   * @returns {Promise<HarvestJob | null>}
   */
  static async delete(params) {
    const job = await harvestJobPrisma.remove(params);

    triggerHooks('harvest-job:delete', job);

    return job;
  }

  /**
   * @param {HarvestJob} job
   * @param {object} options
   * @param {string} [options.status=finished] - The status of the task
   * @param {string} [options.errorCode] - An error code
   * @returns {Promise<HarvestJob>}
   */
  static finish(job, options = {}) {
    const { status = 'finished', errorCode } = options;
    const { startedAt, createdAt } = job;

    let runningTime;

    if (startedAt) {
      runningTime = Date.now() - startedAt.getTime();
    } else if (createdAt) {
      runningTime = Date.now() - createdAt.getTime();
    }

    return HarvestJobsService.update({
      where: { id: job.id },
      data: { status, runningTime, errorCode },
    });
  }

  /**
   * Returns whether the job is terminated or not by checking its status
   * @param {HarvestJob} job - The job to check
   */
  static isDone(job) {
    return ['finished', 'failed', 'cancelled', 'delayed'].includes(job?.status);
  }

  /**
   * Cancel a job
   * @param {HarvestJob} job - The job to cancel
   */
  static cancel(job) {
    return HarvestJobsService.update({
      where: { id: job.id },
      data: { status: 'cancelled' },
    });
  }
};

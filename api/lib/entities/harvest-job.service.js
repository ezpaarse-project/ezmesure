// @ts-check
const { client: prisma, Prisma } = require('../services/prisma.service');
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
    const job = await prisma.harvestJob.create(params);

    triggerHooks('harvest-job:create', job);

    return job;
  }

  /**
   * @param {HarvestJobFindManyArgs} params
   * @returns {Promise<HarvestJob[]>}
   */
  static findMany(params) {
    return prisma.harvestJob.findMany(params);
  }

  /**
   * @param {HarvestJobFindUniqueArgs} params
   * @returns {Promise<HarvestJob | null>}
   */
  static findUnique(params) {
    return prisma.harvestJob.findUnique(params);
  }

  /**
   * @param {HarvestJobFindFirstArgs} params
   * @returns {Promise<HarvestJob | null>}
   */
  static findFirst(params) {
    return prisma.harvestJob.findFirst(params);
  }

  /**
   * @param {HarvestJobUpdateArgs} params
   * @returns {Promise<HarvestJob>}
   */
  static async update(params) {
    const job = await prisma.harvestJob.update(params);

    triggerHooks('harvest-job:update', job);

    return job;
  }

  /**
   * @param {HarvestJobUpsertArgs} params
   * @returns {Promise<HarvestJob>}
   */
  static async upsert(params) {
    const job = await prisma.harvestJob.upsert(params);

    triggerHooks('harvest-job:upsert', job);

    return job;
  }

  /**
   * @param {HarvestJobDeleteArgs} params
   * @returns {Promise<HarvestJob | null>}
   */
  static async delete(params) {
    let job;

    try {
      job = await prisma.harvestJob.delete(params);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return null;
      }
      throw error;
    }

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

// @ts-check
const harvestJobPrisma = require('../services/prisma/harvest-job');
const BasePrismaService = require('./base-prisma.service');

/* eslint-disable max-len */
/** @typedef {import('../.prisma/client.mts').HarvestJob} HarvestJob */
/** @typedef {import('../.prisma/client.mts').HarvestJobStatus} HarvestJobStatus */
/** @typedef {import('../.prisma/client.mts').Prisma.HarvestJobUpdateArgs} HarvestJobUpdateArgs */
/** @typedef {import('../.prisma/client.mts').Prisma.HarvestJobUpsertArgs} HarvestJobUpsertArgs */
/** @typedef {import('../.prisma/client.mts').Prisma.HarvestJobDeleteArgs} HarvestJobDeleteArgs */
/** @typedef {import('../.prisma/client.mts').Prisma.HarvestJobFindUniqueArgs} HarvestJobFindUniqueArgs */
/** @typedef {import('../.prisma/client.mts').Prisma.HarvestJobFindFirstArgs} HarvestJobFindFirstArgs */
/** @typedef {import('../.prisma/client.mts').Prisma.HarvestJobFindManyArgs} HarvestJobFindManyArgs */
/** @typedef {import('../.prisma/client.mts').Prisma.HarvestJobGroupByArgs} HarvestJobGroupByArgs */
/** @typedef {import('../.prisma/client.mts').Prisma.HarvestJobAggregateArgs} HarvestJobAggregateArgs */
/** @typedef {import('../.prisma/client.mts').Prisma.HarvestJobCountArgs} HarvestJobCountArgs */
/** @typedef {import('../.prisma/client.mts').Prisma.HarvestJobCreateArgs} HarvestJobCreateArgs */
/* eslint-enable max-len */

module.exports = class HarvestJobsService extends BasePrismaService {
  /** @type {BasePrismaService.TransactionFnc<HarvestJobsService>} */
  static $transaction = super.$transaction;

  /** @type {HarvestJobStatus[]} */
  static endStatuses = ['finished', 'failed', 'cancelled', 'interrupted'];

  /** @type {HarvestJobStatus} */
  static delayedStatus = 'delayed';

  /**
   * Returns whether the job is terminated or not by checking its status
   * @param {HarvestJob} job - The job to check
   */
  static isDone(job) {
    return this.endStatuses.includes(job?.status);
  }

  /**
   * Returns whether the job has been delayed
   * @param {HarvestJob} job - The job to check
   */
  static isDelayed(job) {
    return job?.status === this.delayedStatus;
  }

  /**
   * @param {HarvestJobCreateArgs} params
   * @returns {Promise<HarvestJob>}
   */
  async create(params) {
    const job = await harvestJobPrisma.create(params, this.prisma);

    this.triggerHooks('harvest-job:create', job);

    return job;
  }

  /**
   * @param {HarvestJobFindManyArgs} params
   * @returns {Promise<HarvestJob[]>}
   */
  findMany(params) {
    return harvestJobPrisma.findMany(params, this.prisma);
  }

  /**
   * @param {HarvestJobFindUniqueArgs} params
   * @returns {Promise<HarvestJob | null>}
   */
  findUnique(params) {
    return harvestJobPrisma.findUnique(params, this.prisma);
  }

  /**
   * @param {HarvestJobFindFirstArgs} params
   * @returns {Promise<HarvestJob | null>}
   */
  findFirst(params) {
    return harvestJobPrisma.findFirst(params, this.prisma);
  }

  /**
   * @param {HarvestJobGroupByArgs} params
   * @returns
   */
  groupBy(params) {
    return harvestJobPrisma.groupBy(params, this.prisma);
  }

  /**
   * @param {HarvestJobAggregateArgs} params
   * @returns
   */
  aggregate(params) {
    return harvestJobPrisma.aggregate(params, this.prisma);
  }

  /**
   * @param {HarvestJobCountArgs} params
   * @returns {Promise<number>}
   */
  count(params) {
    return harvestJobPrisma.count(params, this.prisma);
  }

  /**
   * @param {HarvestJobUpdateArgs} params
   * @returns {Promise<HarvestJob>}
   */
  async update(params) {
    const job = await harvestJobPrisma.update(params, this.prisma);

    this.triggerHooks('harvest-job:update', job);

    return job;
  }

  /**
   * @param {HarvestJobUpsertArgs} params
   * @returns {Promise<HarvestJob>}
   */
  async upsert(params) {
    const job = await harvestJobPrisma.upsert(params, this.prisma);

    this.triggerHooks('harvest-job:upsert', job);

    return job;
  }

  /**
   * @param {HarvestJobDeleteArgs} params
   * @returns {Promise<HarvestJob | null>}
   */
  async delete(params) {
    const job = await harvestJobPrisma.remove(params, this.prisma);

    this.triggerHooks('harvest-job:delete', job);

    return job;
  }

  /**
   * @param {HarvestJob} job
   * @param {object} options
   * @param {string} [options.status=finished] - The status of the task
   * @param {string} [options.errorCode] - An error code
   * @returns {Promise<HarvestJob>}
   */
  finish(job, options = {}) {
    const { status = 'finished', errorCode } = options;
    const { startedAt, createdAt } = job;

    let runningTime;

    if (startedAt) {
      runningTime = Date.now() - startedAt.getTime();
    } else if (createdAt) {
      runningTime = Date.now() - createdAt.getTime();
    }

    return this.update({
      where: { id: job.id },
      data: {
        // @ts-ignore
        status,
        runningTime,
        errorCode,
      },
    });
  }

  /**
   * Cancel a job
   * @param {HarvestJob} job - The job to cancel
   */
  cancel(job) {
    return this.update({
      where: { id: job.id },
      data: { status: 'cancelled' },
    });
  }
};

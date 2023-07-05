// @ts-check
const { client: prisma } = require('../services/prisma.service');

/* eslint-disable max-len */
/** @typedef {import('@prisma/client').HarvestJob} HarvestJob */
/** @typedef {import('@prisma/client').Prisma.HarvestJobUpdateArgs} HarvestJobUpdateArgs */
/** @typedef {import('@prisma/client').Prisma.HarvestJobUpsertArgs} HarvestJobUpsertArgs */
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
  static create(params) {
    return prisma.harvestJob.create(params);
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
  static update(params) {
    return prisma.harvestJob.update(params);
  }

  /**
   * @param {HarvestJobUpsertArgs} params
   * @returns {Promise<HarvestJob>}
   */
  static upsert(params) {
    return prisma.harvestJob.upsert(params);
  }

  /**
   * @param {HarvestJob} job
   * @param {object} options
   * @returns {Promise<HarvestJob>}
   */
  static finish(job, options = {}) {
    const { status = 'finished' } = options;
    const { startedAt, createdAt } = job;

    let runningTime;

    if (startedAt) {
      runningTime = Date.now() - startedAt.getTime();
    } else if (createdAt) {
      runningTime = Date.now() - createdAt.getTime();
    }

    return prisma.harvestJob.update({
      where: { id: job.id },
      data: { status, runningTime },
    });
  }
};

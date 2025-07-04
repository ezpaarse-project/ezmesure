// @ts-check
const harvestPrisma = require('../services/prisma/harvest');

const BasePrismaService = require('./base-prisma.service');

/* eslint-disable max-len */
/** @typedef {import('@prisma/client').Harvest} Harvest */
/** @typedef {import('@prisma/client').Prisma.HarvestUpdateArgs} HarvestUpdateArgs */
/** @typedef {import('@prisma/client').Prisma.HarvestUpsertArgs} HarvestUpsertArgs */
/** @typedef {import('@prisma/client').Prisma.HarvestFindUniqueArgs} HarvestFindUniqueArgs */
/** @typedef {import('@prisma/client').Prisma.HarvestFindManyArgs} HarvestFindManyArgs */
/** @typedef {import('@prisma/client').Prisma.HarvestCountArgs} HarvestCountArgs */
/** @typedef {import('@prisma/client').Prisma.HarvestCreateArgs} HarvestCreateArgs */
/** @typedef {import('@prisma/client').Prisma.HarvestDeleteManyArgs} HarvestDeleteManyArgs */
/** @typedef {import('@prisma/client').Prisma.HarvestInclude} HarvestInclude */
/* eslint-enable max-len */

module.exports = class HarvestsService extends BasePrismaService {
  /** @type {BasePrismaService.TransactionFnc<HarvestsService>} */
  static $transaction = super.$transaction;

  /**
   * @param {HarvestCreateArgs} params
   * @returns {Promise<Harvest>}
   */
  create(params) {
    return harvestPrisma.create(params, this.prisma);
  }

  /**
   * @param {HarvestFindManyArgs} params
   * @returns {Promise<Harvest[]>}
   */
  findMany(params) {
    return harvestPrisma.findMany(params, this.prisma);
  }

  /**
   * @param {HarvestFindUniqueArgs} params
   * @returns {Promise<Harvest | null>}
   */
  findUnique(params) {
    return harvestPrisma.findUnique(params, this.prisma);
  }

  /**
   * @param {HarvestCountArgs} params
   * @returns {Promise<number>}
   */
  count(params) {
    return harvestPrisma.count(params, this.prisma);
  }

  /**
   * @param {HarvestUpdateArgs} params
   * @returns {Promise<Harvest>}
   */
  update(params) {
    return harvestPrisma.update(params, this.prisma);
  }

  /**
   * @param {HarvestUpsertArgs} params
   * @returns {Promise<Harvest>}
   */
  upsert(params) {
    return harvestPrisma.upsert(params, this.prisma);
  }

  /**
   * @param {HarvestDeleteManyArgs} params
   * @returns {Promise<number>}
   */
  deleteMany(params) {
    return harvestPrisma.removeMany(params, this.prisma);
  }

  /**
   * Scroll through harvests
   *
   * @param {Omit<HarvestFindManyArgs, 'skip' | 'cursor' | 'orderBy'>} [query]
   *
   * @returns {AsyncGenerator<Harvest>}
   */
  async* scroll(query = {}) {
    let cursor;

    do {
      // eslint-disable-next-line no-await-in-loop
      const data = await this.prisma?.harvest.findMany({
        ...query,
        // Cursor pagination
        take: query.take || 5000,
        skip: cursor ? 1 : 0,
        cursor: cursor ? { credentialsId_reportId_period: cursor } : undefined,
        // Sort by cursor
        orderBy: [
          { credentialsId: 'asc' },
          { reportId: 'asc' },
          { period: 'asc' },
        ],
      });

      yield* data;

      cursor = undefined;

      // Update cursor
      const lastItem = data.at(-1);
      if (lastItem) {
        cursor = {
          credentialsId: lastItem.credentialsId,
          reportId: lastItem.reportId,
          period: lastItem.period,
        };
      }
    } while (cursor);
  }
};

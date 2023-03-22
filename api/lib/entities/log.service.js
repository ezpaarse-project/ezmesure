// @ts-check
const prisma = require('../services/prisma.service');

/* eslint-disable max-len */
/** @typedef {import('@prisma/client').Log} Log */
/** @typedef {import('@prisma/client').Prisma.LogUpdateArgs} LogUpdateArgs */
/** @typedef {import('@prisma/client').Prisma.LogUpsertArgs} LogUpsertArgs */
/** @typedef {import('@prisma/client').Prisma.LogFindUniqueArgs} LogFindUniqueArgs */
/** @typedef {import('@prisma/client').Prisma.LogFindManyArgs} LogFindManyArgs */
/** @typedef {import('@prisma/client').Prisma.LogCreateArgs} LogCreateArgs */
/* eslint-enable max-len */

module.exports = class LogsService {
  /**
   * @param {LogCreateArgs} params
   * @returns {Promise<Log>}
   */
  static create(params) {
    return prisma.log.create(params);
  }

  /**
   * @param {LogFindManyArgs} params
   * @returns {Promise<Log[]>}
   */
  static findMany(params) {
    return prisma.log.findMany(params);
  }

  /**
   * @param {LogFindUniqueArgs} params
   * @returns {Promise<Log | null>}
   */
  static findUnique(params) {
    return prisma.log.findUnique(params);
  }

  /**
   * @param {LogUpdateArgs} params
   * @returns {Promise<Log>}
   */
  static update(params) {
    return prisma.log.update(params);
  }

  /**
   * @param {LogUpsertArgs} params
   * @returns {Promise<Log>}
   */
  static upsert(params) {
    return prisma.log.upsert(params);
  }
};

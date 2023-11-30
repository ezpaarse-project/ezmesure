// @ts-check
const logPrisma = require('../services/prisma/log');

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
    return logPrisma.create(params);
  }

  /**
   * @param {LogFindManyArgs} params
   * @returns {Promise<Log[]>}
   */
  static findMany(params) {
    return logPrisma.findMany(params);
  }

  /**
   * @param {LogFindUniqueArgs} params
   * @returns {Promise<Log | null>}
   */
  static findUnique(params) {
    return logPrisma.findUnique(params);
  }

  /**
   * @param {LogUpdateArgs} params
   * @returns {Promise<Log>}
   */
  static update(params) {
    return logPrisma.update(params);
  }

  /**
   * @param {LogUpsertArgs} params
   * @returns {Promise<Log>}
   */
  static upsert(params) {
    return logPrisma.upsert(params);
  }

  /**
   * @param {string} jobId - identifier of the associated harvest job
   * @param {string} level - log level
   * @param {string} message - log message
   * @returns {Promise<Log>}
   */
  static log(jobId, level, message) {
    return logPrisma.create({ data: { jobId, level, message } });
  }
};

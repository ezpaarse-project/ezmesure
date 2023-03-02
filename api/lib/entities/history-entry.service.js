// @ts-check
const prisma = require('../services/prisma.service');

/** @typedef {import('@prisma/client').HistoryEntry} HistoryEntry */
/** @typedef {import('@prisma/client').Prisma.HistoryEntryUpdateArgs} HistoryEntryUpdateArgs */
/** @typedef {import('@prisma/client').Prisma.HistoryEntryUpsertArgs} HistoryEntryUpsertArgs */
/** @typedef {import('@prisma/client').Prisma.HistoryEntryFindUniqueArgs} HistoryEntryFindUniqueArgs */
/** @typedef {import('@prisma/client').Prisma.HistoryEntryFindManyArgs} HistoryEntryFindManyArgs */
/** @typedef {import('@prisma/client').Prisma.HistoryEntryCreateArgs} HistoryEntryCreateArgs */

module.exports = class HistoryEntrysService {
  /**
   * @param {HistoryEntryCreateArgs} params
   * @returns {Promise<HistoryEntry>}
   */
  static create(params) {
    return prisma.historyEntry.create(params);
  }

  /**
   * @param {HistoryEntryFindManyArgs} params
   * @returns {Promise<HistoryEntry[]>}
   */
  static findMany(params) {
    return prisma.historyEntry.findMany(params);
  }

  /**
   * @param {HistoryEntryFindUniqueArgs} params
   * @returns {Promise<HistoryEntry | null>}
   */
  static findUnique(params) {
    return prisma.historyEntry.findUnique(params);
  }

  /**
   * @param {HistoryEntryUpdateArgs} params
   * @returns {Promise<HistoryEntry>}
   */
  static update(params) {
    return prisma.historyEntry.update(params);
  }

  /**
   * @param {HistoryEntryUpsertArgs} params
   * @returns {Promise<HistoryEntry>}
   */
  static upsert(params) {
    return prisma.historyEntry.upsert(params);
  }
};

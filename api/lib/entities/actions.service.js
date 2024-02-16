// @ts-check
const actionsPrisma = require('../services/prisma/actions');

/* eslint-disable max-len */
/** @typedef {import('@prisma/client').Action} Action */
/** @typedef {import('@prisma/client').Prisma.ActionUpdateArgs} ActionUpdateArgs */
/** @typedef {import('@prisma/client').Prisma.ActionUpsertArgs} ActionUpsertArgs */
/** @typedef {import('@prisma/client').Prisma.ActionFindUniqueArgs} ActionFindUniqueArgs */
/** @typedef {import('@prisma/client').Prisma.ActionFindManyArgs} ActionFindManyArgs */
/** @typedef {import('@prisma/client').Prisma.ActionCreateArgs} ActionCreateArgs */
/* eslint-enable max-len */

module.exports = class ActionsService {
  /**
   * @param {ActionCreateArgs} params
   * @returns {Promise<Action>}
   */
  static create(params) {
    return actionsPrisma.create(params);
  }

  /**
   * @param {ActionFindManyArgs} params
   * @returns {Promise<Action[]>}
   */
  static findMany(params) {
    return actionsPrisma.findMany(params);
  }

  /**
   * @param {ActionFindUniqueArgs} params
   * @returns {Promise<Action | null>}
   */
  static findUnique(params) {
    return actionsPrisma.findUnique(params);
  }

  /**
   * @param {ActionUpdateArgs} params
   * @returns {Promise<Action>}
   */
  static update(params) {
    return actionsPrisma.update(params);
  }

  /**
   * @param {ActionUpsertArgs} params
   * @returns {Promise<Action>}
   */
  static upsert(params) {
    return actionsPrisma.upsert(params);
  }
};

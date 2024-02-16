// @ts-check
const BasePrismaService = require('./base-prisma.service');
const actionsPrisma = require('../services/prisma/actions');

/* eslint-disable max-len */
/** @typedef {import('@prisma/client').Action} Action */
/** @typedef {import('@prisma/client').Prisma.ActionUpdateArgs} ActionUpdateArgs */
/** @typedef {import('@prisma/client').Prisma.ActionUpsertArgs} ActionUpsertArgs */
/** @typedef {import('@prisma/client').Prisma.ActionFindUniqueArgs} ActionFindUniqueArgs */
/** @typedef {import('@prisma/client').Prisma.ActionFindManyArgs} ActionFindManyArgs */
/** @typedef {import('@prisma/client').Prisma.ActionCreateArgs} ActionCreateArgs */
/* eslint-enable max-len */

module.exports = class ActionsService extends BasePrismaService {
  /** @type {BasePrismaService.TransactionFnc<ActionsService>} */
  static $transaction = super.$transaction;

  /**
   * @param {ActionCreateArgs} params
   * @returns {Promise<Action>}
   */
  create(params) {
    return actionsPrisma.create(params, this.prisma);
  }

  /**
   * @param {ActionFindManyArgs} params
   * @returns {Promise<Action[]>}
   */
  findMany(params) {
    return actionsPrisma.findMany(params, this.prisma);
  }

  /**
   * @param {ActionFindUniqueArgs} params
   * @returns {Promise<Action | null>}
   */
  findUnique(params) {
    return actionsPrisma.findUnique(params, this.prisma);
  }

  /**
   * @param {ActionUpdateArgs} params
   * @returns {Promise<Action>}
   */
  update(params) {
    return actionsPrisma.update(params, this.prisma);
  }

  /**
   * @param {ActionUpsertArgs} params
   * @returns {Promise<Action>}
   */
  upsert(params) {
    return actionsPrisma.upsert(params, this.prisma);
  }
};

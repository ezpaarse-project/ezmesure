// @ts-check
const BasePrismaService = require('./base-prisma.service');
const outgoingEmailsPrisma = require('../services/prisma/outgoing-emails');

/* eslint-disable max-len */
/** @typedef {import('../.prisma/client.mts').Prisma.BatchPayload} BatchPayload */
/** @typedef {import('../.prisma/client.mts').OutgoingEmail} OutgoingEmail */
/** @typedef {import('../.prisma/client.mts').Prisma.OutgoingEmailUpdateArgs} OutgoingEmailUpdateArgs */
/** @typedef {import('../.prisma/client.mts').Prisma.OutgoingEmailUpsertArgs} OutgoingEmailUpsertArgs */
/** @typedef {import('../.prisma/client.mts').Prisma.OutgoingEmailFindUniqueArgs} OutgoingEmailFindUniqueArgs */
/** @typedef {import('../.prisma/client.mts').Prisma.OutgoingEmailFindManyArgs} OutgoingEmailFindManyArgs */
/** @typedef {import('../.prisma/client.mts').Prisma.OutgoingEmailCreateArgs} OutgoingEmailCreateArgs */
/** @typedef {import('../.prisma/client.mts').Prisma.OutgoingEmailCountArgs} OutgoingEmailCountArgs */
/** @typedef {import('../.prisma/client.mts').Prisma.OutgoingEmailDeleteManyArgs} OutgoingEmailDeleteManyArgs */
/* eslint-enable max-len */

module.exports = class OutgoingEmailsService extends BasePrismaService {
  /** @type {BasePrismaService.TransactionFnc<OutgoingEmailsService>} */
  static $transaction = super.$transaction;

  /**
   * @param {OutgoingEmailCreateArgs} params
   * @returns {Promise<OutgoingEmail>}
   */
  create(params) {
    return outgoingEmailsPrisma.create(params, this.prisma);
  }

  /**
   * @param {OutgoingEmailFindManyArgs} params
   * @returns {Promise<OutgoingEmail[]>}
   */
  findMany(params) {
    return outgoingEmailsPrisma.findMany(params, this.prisma);
  }

  /**
   * @param {OutgoingEmailFindUniqueArgs} params
   * @returns {Promise<OutgoingEmail | null>}
   */
  findUnique(params) {
    return outgoingEmailsPrisma.findUnique(params, this.prisma);
  }

  /**
   * @param {OutgoingEmailUpdateArgs} params
   * @returns {Promise<OutgoingEmail>}
   */
  update(params) {
    return outgoingEmailsPrisma.update(params, this.prisma);
  }

  /**
   * @param {OutgoingEmailUpsertArgs} params
   * @returns {Promise<OutgoingEmail>}
   */
  upsert(params) {
    return outgoingEmailsPrisma.upsert(params, this.prisma);
  }

  /**
   * @param {OutgoingEmailCountArgs} params
   * @returns {Promise<number>}
   */
  count(params) {
    return outgoingEmailsPrisma.count(params, this.prisma);
  }

  /**
   * @param {OutgoingEmailCountArgs} params
   * @returns {Promise<BatchPayload>}
   */
  deleteMany(params) {
    return outgoingEmailsPrisma.deleteMany(params, this.prisma);
  }
};

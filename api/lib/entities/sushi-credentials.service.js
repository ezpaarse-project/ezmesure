// @ts-check
const BasePrismaService = require('./base-prisma.service');
const sushiCredentialsPrisma = require('../services/prisma/sushi-credentials');

/* eslint-disable max-len */
/** @typedef {import('@prisma/client').SushiCredentials} SushiCredentials */
/** @typedef {import('@prisma/client').Prisma.SushiCredentialsUpdateArgs} SushiCredentialsUpdateArgs */
/** @typedef {import('@prisma/client').Prisma.SushiCredentialsUpsertArgs} SushiCredentialsUpsertArgs */
/** @typedef {import('@prisma/client').Prisma.SushiCredentialsCountArgs} SushiCredentialsCountArgs */
/** @typedef {import('@prisma/client').Prisma.SushiCredentialsFindUniqueArgs} SushiCredentialsFindUniqueArgs */
/** @typedef {import('@prisma/client').Prisma.SushiCredentialsFindManyArgs} SushiCredentialsFindManyArgs */
/** @typedef {import('@prisma/client').Prisma.SushiCredentialsCreateArgs} SushiCredentialsCreateArgs */
/** @typedef {import('@prisma/client').Prisma.SushiCredentialsDeleteArgs} SushiCredentialsDeleteArgs */
/* eslint-enable max-len */

module.exports = class SushiCredentialsService extends BasePrismaService {
  /** @type {BasePrismaService.TransactionFnc<SushiCredentialsService>} */
  static $transaction = super.$transaction;

  /**
   * @param {SushiCredentialsCreateArgs} params
   * @returns {Promise<SushiCredentials>}
   */
  create(params) {
    return sushiCredentialsPrisma.create(params, this.prisma);
  }

  /**
   * @param {SushiCredentialsFindManyArgs} params
   * @returns {Promise<SushiCredentials[]>}
   */
  findMany(params) {
    return sushiCredentialsPrisma.findMany(params, this.prisma);
  }

  /**
   * @param {SushiCredentialsFindUniqueArgs} params
   * @returns {Promise<SushiCredentials | null>}
   */
  findUnique(params) {
    return sushiCredentialsPrisma.findUnique(params, this.prisma);
  }

  /**
   * @param {string} id
   * @returns {Promise<SushiCredentials | null>}
   */
  findByID(id) {
    return sushiCredentialsPrisma.findByID(id, this.prisma);
  }

  /**
   * @param {SushiCredentialsUpdateArgs} params
   * @returns {Promise<SushiCredentials>}
   */
  update(params) {
    return sushiCredentialsPrisma.update(params, this.prisma);
  }

  /**
   * @param {SushiCredentialsUpsertArgs} params
   * @returns {Promise<SushiCredentials>}
   */
  upsert(params) {
    return sushiCredentialsPrisma.upsert(params, this.prisma);
  }

  /**
   * @param {SushiCredentialsCountArgs} params
   * @returns {Promise<number>}
   */
  count(params) {
    return sushiCredentialsPrisma.count(params, this.prisma);
  }

  /**
   * Mark credentials as deleted before cleaning up data in elastic and then delete
   *
   * @param {SushiCredentialsDeleteArgs} params
   * @returns {Promise<SushiCredentials | null>}
   */
  delete(params) {
    // Mark credentials as deleted
    const credentials = sushiCredentialsPrisma.update({
      ...params,
      data: { deletedAt: new Date() },
    }, this.prisma);

    // A cron will regularly clean up deleted credentials

    return credentials;
  }

  /**
   * @returns {Promise<Array<SushiCredentials> | null>}
   */
  async removeAll() {
    if (process.env.NODE_ENV !== 'dev') { return null; }

    /** @param {SushiCredentialsService} service */
    const transaction = async (service) => {
      const sushiCredentials = await service.findMany({});

      if (sushiCredentials.length === 0) { return null; }

      await Promise.all(
        sushiCredentials.map(
          (sushiCredential) => service.delete({
            where: {
              id: sushiCredential.id,
            },
          }),
        ),
      );

      return sushiCredentials;
    };

    if (this.currentTransaction) {
      return transaction(this);
    }
    return SushiCredentialsService.$transaction(transaction);
  }
};

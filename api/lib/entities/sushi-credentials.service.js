// @ts-check
const BasePrismaService = require('./base-prisma.service');
const sushiCredentialsPrisma = require('../services/prisma/sushi-credentials');

/* eslint-disable max-len */
/** @typedef {import('@prisma/client').SushiCredentials} SushiCredentials */
/** @typedef {import('@prisma/client').Prisma.SushiCredentialsUpdateArgs} SushiCredentialsUpdateArgs */
/** @typedef {import('@prisma/client').Prisma.SushiCredentialsUpsertArgs} SushiCredentialsUpsertArgs */
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
   * @param {SushiCredentialsDeleteArgs} params
   * @returns {Promise<SushiCredentials | null>}
   */
  delete(params) {
    return sushiCredentialsPrisma.remove(params, this.prisma);
  }

  /**
   * @returns {Promise<Array<SushiCredentials> | null>}
   */
  async removeAll() {
    if (process.env.NODE_ENV !== 'dev') { return null; }

    /** @param {SushiCredentialsService} service */
    const processor = async (service) => {
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
      return processor(this);
    }
    return SushiCredentialsService.$transaction(processor);
  }
};

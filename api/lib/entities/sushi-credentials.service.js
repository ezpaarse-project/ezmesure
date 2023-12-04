// @ts-check
const { client: prisma, Prisma } = require('../services/prisma.service');

/* eslint-disable max-len */
/** @typedef {import('@prisma/client').SushiCredentials} SushiCredentials */
/** @typedef {import('@prisma/client').Prisma.SushiCredentialsUpdateArgs} SushiCredentialsUpdateArgs */
/** @typedef {import('@prisma/client').Prisma.SushiCredentialsUpsertArgs} SushiCredentialsUpsertArgs */
/** @typedef {import('@prisma/client').Prisma.SushiCredentialsFindUniqueArgs} SushiCredentialsFindUniqueArgs */
/** @typedef {import('@prisma/client').Prisma.SushiCredentialsFindManyArgs} SushiCredentialsFindManyArgs */
/** @typedef {import('@prisma/client').Prisma.SushiCredentialsCreateArgs} SushiCredentialsCreateArgs */
/** @typedef {import('@prisma/client').Prisma.SushiCredentialsDeleteArgs} SushiCredentialsDeleteArgs */
/* eslint-enable max-len */

module.exports = class SushiCredentialssService {
  /**
   * @param {SushiCredentialsCreateArgs} params
   * @returns {Promise<SushiCredentials>}
   */
  static create(params) {
    return prisma.sushiCredentials.create(params);
  }

  /**
   * @param {SushiCredentialsFindManyArgs} params
   * @returns {Promise<SushiCredentials[]>}
   */
  static findMany(params) {
    return prisma.sushiCredentials.findMany(params);
  }

  /**
   * @param {SushiCredentialsFindUniqueArgs} params
   * @returns {Promise<SushiCredentials | null>}
   */
  static findUnique(params) {
    return prisma.sushiCredentials.findUnique(params);
  }

  /**
   * @param {string} id
   * @returns {Promise<SushiCredentials | null>}
   */
  static findByID(id) {
    return prisma.sushiCredentials.findUnique({ where: { id } });
  }

  /**
   * @param {SushiCredentialsUpdateArgs} params
   * @returns {Promise<SushiCredentials>}
   */
  static update(params) {
    return prisma.sushiCredentials.update(params);
  }

  /**
   * @param {SushiCredentialsUpsertArgs} params
   * @returns {Promise<SushiCredentials>}
   */
  static upsert(params) {
    return prisma.sushiCredentials.upsert(params);
  }

  /**
   * @param {SushiCredentialsDeleteArgs} params
   * @returns {Promise<SushiCredentials | null>}
   */
  static delete(params) {
    return prisma.sushiCredentials.delete(params).catch((e) => {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
        return null;
      }
      throw e;
    });
  }

  /**
   * @returns {Promise<Array<SushiCredentials> | null>}
   */
  static async deleteAll() {
    if (process.env.NODE_ENV === 'production') { return null; }

    const sushiCredentials = await this.findMany({});

    await Promise.all(sushiCredentials.map(async (sushiCredential) => {
      await this.delete({
        where: {
          id: sushiCredential.id,
        },
      });
    }));

    return sushiCredentials;
  }
};

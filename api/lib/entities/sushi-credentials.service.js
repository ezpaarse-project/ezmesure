// @ts-check
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

module.exports = class SushiCredentialsService {
  /**
   * @param {SushiCredentialsCreateArgs} params
   * @returns {Promise<SushiCredentials>}
   */
  static create(params) {
    return sushiCredentialsPrisma.create(params);
  }

  /**
   * @param {SushiCredentialsFindManyArgs} params
   * @returns {Promise<SushiCredentials[]>}
   */
  static findMany(params) {
    return sushiCredentialsPrisma.findMany(params);
  }

  /**
   * @param {SushiCredentialsFindUniqueArgs} params
   * @returns {Promise<SushiCredentials | null>}
   */
  static findUnique(params) {
    return sushiCredentialsPrisma.findUnique(params);
  }

  /**
   * @param {string} id
   * @returns {Promise<SushiCredentials | null>}
   */
  static findByID(id) {
    return sushiCredentialsPrisma.findByID(id);
  }

  /**
   * @param {SushiCredentialsUpdateArgs} params
   * @returns {Promise<SushiCredentials>}
   */
  static update(params) {
    return sushiCredentialsPrisma.update(params);
  }

  /**
   * @param {SushiCredentialsUpsertArgs} params
   * @returns {Promise<SushiCredentials>}
   */
  static upsert(params) {
    return sushiCredentialsPrisma.upsert(params);
  }

  /**
   * @param {SushiCredentialsDeleteArgs} params
   * @returns {Promise<SushiCredentials | null>}
   */
  static delete(params) {
    return sushiCredentialsPrisma.remove(params);
  }

  /**
   * @returns {Promise<Array<SushiCredentials> | null>}
   */
  static async removeAll() {
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

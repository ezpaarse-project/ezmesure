// @ts-check
const BasePrismaService = require('./base-prisma.service');
const sushiCredentialsPrisma = require('../services/prisma/sushi-credentials');

/* eslint-disable max-len */
/**
 * @typedef {import('@prisma/client').SushiCredentials} SushiCredentials
 * @typedef {import('@prisma/client').SushiEndpoint} SushiEndpoint
 * @typedef {import('@prisma/client').Prisma.SushiCredentialsUpdateArgs} SushiCredentialsUpdateArgs
 * @typedef {import('@prisma/client').Prisma.SushiCredentialsUpsertArgs} SushiCredentialsUpsertArgs
 * @typedef {import('@prisma/client').Prisma.SushiCredentialsCountArgs} SushiCredentialsCountArgs
 * @typedef {import('@prisma/client').Prisma.SushiCredentialsFindUniqueArgs} SushiCredentialsFindUniqueArgs
 * @typedef {import('@prisma/client').Prisma.SushiCredentialsFindManyArgs} SushiCredentialsFindManyArgs
 * @typedef {import('@prisma/client').Prisma.SushiCredentialsCreateArgs} SushiCredentialsCreateArgs
 * @typedef {import('@prisma/client').Prisma.SushiCredentialsDeleteArgs} SushiCredentialsDeleteArgs
 * @typedef {import('@prisma/client').Prisma.SushiCredentialsWhereInput} SushiCredentialsWhereInput
 */
/* eslint-enable max-len */

module.exports = class SushiCredentialsService extends BasePrismaService {
  /** @type {BasePrismaService.TransactionFnc<SushiCredentialsService>} */
  static $transaction = super.$transaction;

  /**
   * Prisma query to find enabled credentials
   *
   * @type {import('@prisma/client').Prisma.SushiCredentialsWhereInput}
   */
  static enabledCredentialsQuery = {
    active: true,
    archived: false,
    endpoint: {
      active: true,
    },
  };

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

  /**
   * Find credentials that looks like another
   *
   * @param {SushiCredentials & { endpoint?: SushiEndpoint }} credentials - The credentials
   * used as reference
   * @param {SushiCredentialsWhereInput} [query] - Prisma query that will be added to conditions
   *
   * @returns {Promise<SushiCredentials | null>} - The first credentials that is similar,
   * null if no similar credentials are found
   */
  async findSimilar(credentials, query) {
    const [similar] = await this.findMany({
      where: {
        AND: [
          query ?? {},
          // Is similar cause :
          {
            // Not the same
            id: credentials.id ? { not: credentials.id } : undefined,
            // Not deleted
            deletedAt: null,
            // And one of the following :
            OR: [
              // Same endpoint and same packages
              {
                endpointId: credentials.endpointId,
                packages: { equals: credentials.packages },
              },
              // Same parameters
              {
                customerId: credentials.customerId,
                requestorId: credentials.requestorId,
                apiKey: credentials.apiKey,
                endpoint: {
                  sushiUrl: credentials.endpoint?.sushiUrl,
                  // Ignore if custom params are present
                  params: { isEmpty: true },
                },
                // Ignore if custom params are present
                OR: [
                  { params: { equals: null } },
                  { params: { isEmpty: true } },
                ],
              },
            ],
          },
        ],
      },
      include: {
        endpoint: true,
      },
      take: 1, // is the same as using this.findFirst()
    });

    return similar || null;
  }
};

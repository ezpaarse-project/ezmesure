// @ts-check
const { isAfter } = require('date-fns');

const BasePrismaService = require('./base-prisma.service');
const institutionsPrisma = require('../services/prisma/institutions');
const elasticRolesPrisma = require('../services/prisma/elastic-roles');

const { isFilter, customPropFilter } = require('../services/filters');

const SushiCredentialsService = require('./sushi-credentials.service');

/* eslint-disable max-len */
/**
 * @typedef {import('../.prisma/client').Prisma.JsonValue} JsonValue
 * @typedef {import('../.prisma/client').Institution} Institution
 * @typedef {import('../.prisma/client').Prisma.InstitutionWhereInput} InstitutionWhereInput
 * @typedef {import('../.prisma/client').Prisma.InstitutionUpdateArgs} InstitutionUpdateArgs
 * @typedef {import('../.prisma/client').Prisma.InstitutionUpsertArgs} InstitutionUpsertArgs
 * @typedef {import('../.prisma/client').Prisma.InstitutionFindUniqueArgs} InstitutionFindUniqueArgs
 * @typedef {import('../.prisma/client').Prisma.InstitutionCountArgs} InstitutionCountArgs
 * @typedef {import('../.prisma/client').Prisma.InstitutionFindManyArgs} InstitutionFindManyArgs
 * @typedef {import('../.prisma/client').Prisma.InstitutionCreateArgs} InstitutionCreateArgs
 * @typedef {import('../.prisma/client').Prisma.InstitutionDeleteArgs} InstitutionDeleteArgs
 * @typedef {import('../.prisma/client').Prisma.InstitutionGetPayload<{ include: { customProps: true } }>} InstitutionWithProps
 * @typedef {import('../.prisma/client').Prisma.InstitutionPropertyWhereInput} InstitutionPropertyWhereInput
 * @typedef {import('koa').Context['query']} KoaQuery
 * @typedef {import('../services/filters').Filter} Filter
*/
/* eslint-enable max-len */

module.exports = class InstitutionsService extends BasePrismaService {
  /** @type {BasePrismaService.TransactionFnc<InstitutionsService>} */
  static $transaction = super.$transaction;

  /**
   * @param {InstitutionCreateArgs} params
   * @returns {Promise<Institution>}
   */
  async create(params) {
    const institution = await institutionsPrisma.create(params, this.prisma);
    this.triggerHooks('institution:create', institution);
    return institution;
  }

  /**
   * @param {InstitutionCreateArgs} params
   * @returns {Promise<Institution>}
   */
  async createAsUser(params) {
    const institution = await institutionsPrisma.create(params, this.prisma);
    this.triggerHooks('institution:create', institution);
    return institution;
  }

  /**
   * @param {InstitutionFindManyArgs} params
   * @returns {Promise<Institution[]>}
   */
  findMany(params) {
    return institutionsPrisma.findMany(params, this.prisma);
  }

  /**
   * @param {InstitutionFindUniqueArgs} params
   * @returns {Promise<Institution | null>}
   */
  findUnique(params) {
    return institutionsPrisma.findUnique(params, this.prisma);
  }

  /**
   * @param {string} id
   * @param {Object | null} includes
   * @returns {Promise<Institution | null>}
   */
  findByID(id, includes = null) {
    return institutionsPrisma.findByID(id, includes, this.prisma);
  }

  /**
   * @param {InstitutionUpdateArgs} params
   * @returns {Promise<Institution>}
   */
  async update(params) {
    const institution = await institutionsPrisma.update(params, this.prisma);
    this.triggerHooks('institution:update', institution);
    return institution;
  }

  /**
   * @param {string} institutionId
   * @param {string} subInstitutionId
   * @returns {Promise<Institution>}
   */
  async addSubInstitution(institutionId, subInstitutionId) {
    const institution = await institutionsPrisma.addSubInstitution(
      institutionId,
      subInstitutionId,
      this.prisma,
    );
    this.triggerHooks('institution:update', institution);
    return institution;
  }

  /**
   * @param {string} id
   * @returns {Promise<Institution>}
   */
  async validate(id) {
    const institution = await institutionsPrisma.validate(id, this.prisma);
    this.triggerHooks('institution:update', institution);
    return institution;
  }

  /**
   * @param {InstitutionUpsertArgs} params
   * @returns {Promise<Institution>}
   */
  async upsert(params) {
    const institution = await institutionsPrisma.upsert(params, this.prisma);
    this.triggerHooks('institution:upsert', institution);
    return institution;
  }

  /**
   * @param {InstitutionCountArgs} params
   * @returns {Promise<number>}
   */
  count(params) {
    return institutionsPrisma.count(params, this.prisma);
  }

  /**
   * @param {InstitutionDeleteArgs} params
   * @returns {Promise<Institution | null>}
   */
  async delete(params) {
    const data = await institutionsPrisma.remove(params, this.prisma);

    if (!data) return null;

    const {
      deletedInstitution,
      deletedRepos,
      institution,
    } = data;

    this.triggerHooks('institution:delete', institution);

    institution.memberships?.forEach((element) => {
      this.triggerHooks('memberships:delete', element);

      element.repositoryPermissions.forEach((repoPerm) => { this.triggerHooks('repository_permission:delete', repoPerm); });
      element.spacePermissions.forEach((spacePerm) => { this.triggerHooks('space_permission:delete', spacePerm); });
    });
    institution.spaces?.forEach((element) => { this.triggerHooks('space:delete', element); });
    deletedRepos.forEach((element) => { this.triggerHooks('repository:delete', element); });
    institution.sushiCredentials?.forEach((element) => { this.triggerHooks('sushi_credentials:delete', element); });

    return deletedInstitution;
  }

  /**
   * @returns {Promise<Object | null>}
   */
  async removeAll() {
    if (process.env.NODE_ENV !== 'dev') { return null; }

    /** @param {InstitutionsService} service */
    const transaction = async (service) => {
      const institutions = await service.findMany({});

      if (institutions.length === 0) { return null; }

      await Promise.all(
        institutions.map(
          (institution) => service.delete({
            where: {
              id: institution.id,
            },
          }),
        ),
      );

      return institutions;
    };

    if (this.currentTransaction) {
      return transaction(this);
    }
    return InstitutionsService.$transaction(transaction);
  }

  /**
   * Get institutions matching given conditions
   * @param {Filter[] | JsonValue[]} conditions
   * @returns {Promise<Institution[]>}
   */
  async findManyByConditions(conditions) {
    /** @type {InstitutionWhereInput[]} */
    const institutionsQueries = [];

    // eslint-disable-next-line no-restricted-syntax
    for (const condition of conditions) {
      if (!isFilter(condition)) {
        // eslint-disable-next-line no-continue
        continue;
      }

      /** @type {InstitutionWhereInput} */
      let item;
      const { field, value, isNot } = condition;

      if (field.startsWith('customProps.')) {
        item = {
          customProps: {
            [isNot ? 'none' : 'some']: customPropFilter(field.slice(12), value),
          },
        };
      } else if (Array.isArray(value)) {
        item = {
          [field]: { [isNot ? 'notIn' : 'in']: value },
        };
      } else {
        item = {
          [field]: { [isNot ? 'not' : 'equals']: value ?? null },
        };
      }

      institutionsQueries.push(item);
    }

    /** @type {InstitutionWithProps[]} */
    let institutions = [];

    if (institutionsQueries.length > 0) {
      // @ts-ignore
      institutions = await this.findMany({
        where: { AND: institutionsQueries },
        include: { customProps: true },
      });
    }

    return institutions;
  }

  async connectRole(id, roleName) {
    const role = await elasticRolesPrisma.findUnique({
      where: { name: roleName },
    });

    if (!role) {
      throw new Error(`Role ${roleName} doesn't exists`);
    }

    if (role.conditions.length > 0) {
      throw new Error(`Role ${roleName} is managed by conditions, you can't connect an institution to that role`);
    }

    const { elasticRoles, ...institution } = await institutionsPrisma.update({
      where: { id },
      data: {
        elasticRoles: { connect: { name: roleName } },
      },
      include: { elasticRoles: true },
    }, this.prisma);
    this.triggerHooks('institution:connect:elastic_role', { institution, role: elasticRoles.find((r) => r.name === roleName) });

    return institution;
  }

  async disconnectRole(id, roleName) {
    const role = await elasticRolesPrisma.findUnique({
      where: { name: roleName },
    });

    if (!role) {
      throw new Error(`Role ${roleName} doesn't exists`);
    }

    if (role.conditions.length > 0) {
      throw new Error(`Role ${roleName} is managed by conditions, you can't disconnect an institution to that role`);
    }

    const { elasticRoles, ...institution } = await institutionsPrisma.update({
      where: { id },
      data: {
        elasticRoles: { disconnect: { name: roleName } },
      },
      include: { elasticRoles: true },
    }, this.prisma);
    this.triggerHooks('institution:disconnect:elastic_role', { institution, role: elasticRoles.find((r) => r.name === roleName) });

    return institution;
  }

  /**
   * Check if an institution is harvestable
   *
   * @param {string} institutionId - The id of institution to check
   * @param {Object} [opts] - Options to custom behaviour
   * @param {boolean} [opts.allowNotReady] - Allow not ready institutions
   * @param {boolean} [opts.allowFaulty] - Allow faulty credentials
   * @param {boolean} [opts.allowHarvested] - Allow already harvested institutions
   * @param {boolean} [opts.allEndpointsMustBeUnharvested] - All endpoints must be unharvested to
   * consider the institution harvestable
   * @param {string} [opts.harvestedMonth] - Allow institutions harvested after
   * ready date, but still not harvested for given month
   *
   * @returns {Promise<{ value: boolean, reasons: string[] }>}
   */
  async isHarvestable(institutionId, opts = {}) {
    const now = new Date();

    /** @type {string[]} */
    const reasons = [];

    const { sushiReadySince } = await this.findUnique({
      where: { id: institutionId },
      select: { sushiReadySince: true },
    }) ?? {};

    // /!\ null IS VALID - undefined means institution was not found
    if (sushiReadySince === undefined) {
      throw new Error(`Institution ${institutionId} was not found`);
    }

    // Check if institution is ready
    if (!opts.allowNotReady) {
      if (!sushiReadySince || isAfter(sushiReadySince, now)) {
        reasons.push('institutionIsNotReady');
      }
    }

    const credentialsService = new SushiCredentialsService(this);
    const enabledCredentials = await credentialsService.count({
      where: {
        ...SushiCredentialsService.enabledCredentialsQuery,
        institutionId,
      },
    });

    // Check if have enabled credentials
    if (enabledCredentials <= 0) {
      reasons.push('institutionHasNoCredentials');
    }

    // Count credentials by status
    const countCredentialsByStatus = (status) => credentialsService.count({
      where: {
        ...SushiCredentialsService.enabledCredentialsQuery,
        institutionId,
        connection: { path: ['status'], equals: status },
      },
    });

    const credentialsCount = {
      success: await countCredentialsByStatus('success'),
      failed: await countCredentialsByStatus('failed'),
    };

    if (!opts.allowFaulty) {
      // Failed credentials will not be harvested, but still counted as valid credentials when
      // checking if institution is harvestable
      if ((credentialsCount.success + credentialsCount.failed) < enabledCredentials) {
        reasons.push('institutionHasFaultyCredentials');
      }
    }

    // Check if any credentials are harvested
    if (!opts.allowHarvested) {
      const conditions = [];
      // If provided, check if a harvested period is after given period
      if (opts.harvestedMonth) {
        conditions.push({
          harvests: {
            some: {
              period: { gte: opts.harvestedMonth },
            },
          },
        });
      }
      // If was ready, check if institution was harvested after last ready date
      if (sushiReadySince) {
        conditions.push({
          harvests: {
            some: {
              harvestedAt: { gte: sushiReadySince },
            },
          },
        });
      }

      const query = [];
      // Failed credentials will not be harvested, so we ignore them by counting them as harvested
      if (!opts.allEndpointsMustBeUnharvested) {
        query.push({ connection: { path: ['status'], equals: 'failed' } });
      }
      if (conditions.length > 0) {
        query.push({ AND: conditions });
      }

      const harvestedCredentialsCount = await credentialsService.count({
        where: {
          ...SushiCredentialsService.enabledCredentialsQuery,
          institutionId,
          OR: query.length > 0 ? query : undefined,
        },
      });

      const isHarvested = opts.allEndpointsMustBeUnharvested
        ? harvestedCredentialsCount > 0
        : harvestedCredentialsCount === enabledCredentials;

      if (isHarvested) {
        reasons.push('institutionIsHarvested');
      }
    }

    return {
      value: reasons.length <= 0,
      reasons,
    };
  }
};

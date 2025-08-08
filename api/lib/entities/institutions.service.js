// @ts-check
const BasePrismaService = require('./base-prisma.service');
const institutionsPrisma = require('../services/prisma/institutions');
const elasticRolesPrisma = require('../services/prisma/elastic-roles');

const { isFilter, customPropFilter } = require('../services/filters');

/* eslint-disable max-len */
/**
 * @typedef {import('@prisma/client').Prisma.JsonValue} JsonValue
 * @typedef {import('@prisma/client').Institution} Institution
 * @typedef {import('@prisma/client').Prisma.InstitutionWhereInput} InstitutionWhereInput
 * @typedef {import('@prisma/client').Prisma.InstitutionUpdateArgs} InstitutionUpdateArgs
 * @typedef {import('@prisma/client').Prisma.InstitutionUpsertArgs} InstitutionUpsertArgs
 * @typedef {import('@prisma/client').Prisma.InstitutionFindUniqueArgs} InstitutionFindUniqueArgs
 * @typedef {import('@prisma/client').Prisma.InstitutionCountArgs} InstitutionCountArgs
 * @typedef {import('@prisma/client').Prisma.InstitutionFindManyArgs} InstitutionFindManyArgs
 * @typedef {import('@prisma/client').Prisma.InstitutionCreateArgs} InstitutionCreateArgs
 * @typedef {import('@prisma/client').Prisma.InstitutionDeleteArgs} InstitutionDeleteArgs
 * @typedef {import('@prisma/client').Prisma.InstitutionGetPayload<{ include: { customProps: true } }>} InstitutionWithProps
 * @typedef {import('@prisma/client').Prisma.InstitutionPropertyWhereInput} InstitutionPropertyWhereInput
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
   * @param {string} institutionId
   * @returns
   */
  getContacts(institutionId) {
    return institutionsPrisma.getContacts(institutionId, this.prisma);
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
};

// @ts-check
const BasePrismaService = require('./base-prisma.service');
const repositoryAliasTemplatesPrisma = require('../services/prisma/repository-alias-templates');

/* eslint-disable max-len */
/** @typedef {import('@prisma/client').RepositoryAliasTemplate} RepositoryAliasTemplate */
/** @typedef {import('@prisma/client').Prisma.RepositoryAliasTemplateUpdateArgs} RepositoryAliasTemplateUpdateArgs */
/** @typedef {import('@prisma/client').Prisma.RepositoryAliasTemplateUpsertArgs} RepositoryAliasTemplateUpsertArgs */
/** @typedef {import('@prisma/client').Prisma.RepositoryAliasTemplateCountArgs} RepositoryAliasTemplateCountArgs */
/** @typedef {import('@prisma/client').Prisma.RepositoryAliasTemplateFindUniqueArgs} RepositoryAliasTemplateFindUniqueArgs */
/** @typedef {import('@prisma/client').Prisma.RepositoryAliasTemplateFindFirstArgs} RepositoryAliasTemplateFindFirstArgs */
/** @typedef {import('@prisma/client').Prisma.RepositoryAliasTemplateFindManyArgs} RepositoryAliasTemplateFindManyArgs */
/** @typedef {import('@prisma/client').Prisma.RepositoryAliasTemplateCreateArgs} RepositoryAliasTemplateCreateArgs */
/** @typedef {import('@prisma/client').Prisma.RepositoryAliasTemplateDeleteArgs} RepositoryAliasTemplateDeleteArgs */
/* eslint-enable max-len */

module.exports = class RepositoriesService extends BasePrismaService {
  /** @type {BasePrismaService.TransactionFnc<RepositoriesService>} */
  static $transaction = super.$transaction;

  /**
   * @param {RepositoryAliasTemplateCreateArgs} params
   * @returns {Promise<RepositoryAliasTemplate>}
   */
  async create(params) {
    const repoAliasTemplate = await repositoryAliasTemplatesPrisma.create(params, this.prisma);
    this.triggerHooks('repository_alias_template:create', repoAliasTemplate);
    return repoAliasTemplate;
  }

  /**
   * @param {RepositoryAliasTemplateFindManyArgs} params
   * @returns {Promise<RepositoryAliasTemplate[]>}
   */
  findMany(params) {
    return repositoryAliasTemplatesPrisma.findMany(params, this.prisma);
  }

  /**
   * @param {RepositoryAliasTemplateFindUniqueArgs} params
   * @returns {Promise<RepositoryAliasTemplate | null>}
   */
  findUnique(params) {
    return repositoryAliasTemplatesPrisma.findUnique(params, this.prisma);
  }

  /**
   * @param {RepositoryAliasTemplateFindFirstArgs} params
   * @returns {Promise<RepositoryAliasTemplate | null>}
   */
  findFirst(params) {
    return repositoryAliasTemplatesPrisma.findFirst(params, this.prisma);
  }

  /**
   * @param {string} pattern
   * @returns {Promise<RepositoryAliasTemplate | null>}
   */
  findByPattern(pattern) {
    return repositoryAliasTemplatesPrisma.findUnique({ where: { pattern } }, this.prisma);
  }

  /**
   * @param {RepositoryAliasTemplateUpdateArgs} params
   * @returns {Promise<RepositoryAliasTemplate>}
   */
  async update(params) {
    const repoAliasTemplate = await repositoryAliasTemplatesPrisma.update(params, this.prisma);
    this.triggerHooks('repository_alias_template:update', repoAliasTemplate);
    return repoAliasTemplate;
  }

  /**
   * @param {RepositoryAliasTemplateUpsertArgs} params
   * @returns {Promise<RepositoryAliasTemplate>}
   */
  async upsert(params) {
    const repoAliasTemplate = await repositoryAliasTemplatesPrisma.upsert(params, this.prisma);
    this.triggerHooks('repository_alias_template:upsert', repoAliasTemplate);
    return repoAliasTemplate;
  }

  /**
   * @param {RepositoryAliasTemplateCountArgs} params
   * @returns {Promise<number>}
   */
  async count(params) {
    return repositoryAliasTemplatesPrisma.count(params, this.prisma);
  }

  /**
   * @param {RepositoryAliasTemplateDeleteArgs} params
   * @returns {Promise<RepositoryAliasTemplate | null>}
   */
  async delete(params) {
    const deletedTemplate = await repositoryAliasTemplatesPrisma.remove(params, this.prisma);

    if (!deletedTemplate) {
      return null;
    }

    const { result, deletedItem } = deletedTemplate;

    this.triggerHooks('repository_alias_template:delete', deletedItem);
    deletedItem.aliases.forEach((repoAlias) => { this.triggerHooks('repository_alias:delete', repoAlias); });

    return result;
  }
};

// @ts-check
const { createHash } = require('node:crypto');
const { appLogger } = require('../../logger');

const RepositoriesService = require('../../../entities/repositories.service');
const RepositoryAliasesService = require('../../../entities/repository-aliases.service');
const SpacesService = require('../../../entities/spaces.service');

const { syncIndexPatterns } = require('../kibana');

const {
  generateRoleNameFromAlias,
  generateElasticPermissions,
} = require('../../../hooks/utils');
const { execThrottledPromises } = require('../../promises');

const { upsertRole, deleteRole } = require('../../elastic/roles');
const {
  upsertAlias,
  deleteAlias,
  upsertTemplate,
  deleteTemplate,
} = require('../../elastic/indices');
const { filtersToESQuery } = require('../../elastic/filters');

/* eslint-disable max-len */
/**
 * @typedef {import('../../promises').ThrottledPromisesResult} ThrottledPromisesResult
 * @typedef {import('@prisma/client').RepositoryAlias} RepositoryAlias
 * @typedef {import('@prisma/client').Prisma.RepositoryGetPayload<{ include: { aliases: true } }>} RepositoryWithAliases
*/
/* eslint-enable max-len */

// Namespace for index templates dedicated to aliases
const aliasTemplatePrefix = 'ezm-aliases';
// Random high priority for templates for minimizing risks of conflict
const aliasTemplatePriority = 679;
// Metadata added to the templates created by ezMESURE so that we can easily recognize them
const templateMeta = {
  createdBy: 'ezmesure',
  description: 'Created by the ezMESURE API to keep indices in sync with aliases',
};

/**
 * Get the name of the index template that contains the aliases for a given repository
 * @param {RepositoryWithAliases} repo - The repository
 * @returns {string}
 */
const getAliasesIndexTemplateName = (repo) => {
  // Adding a short hash to make sure there cannot be any conflict on index template name
  const hash = createHash('sha1').update(repo.pattern).digest('hex').substring(0, 10);

  return [
    aliasTemplatePrefix,
    repo.pattern.replace(/\*/g, ''), // Asterisk not allowed in template names
    hash,
  ].join('_');
};

/**
 * Upsert an index template that contains aliases for a repository
 * @param {string} name - The name of the index template
 * @param {RepositoryWithAliases} repo - The repository with its aliases
 * @returns {Promise<import('@elastic/elasticsearch/index.js').ApiResponse>}
 */
const upsertIndexTemplate = (name, repo) => upsertTemplate({
  name,
  create: false,
  body: {
    priority: aliasTemplatePriority,
    index_patterns: [repo.pattern],
    _meta: templateMeta,
    template: {
      aliases: Object.fromEntries(
        repo.aliases.map((a) => [
          a.pattern,
          a.filters ? { filter: filtersToESQuery(a.filters) } : {},
        ]),
      ),
    },
  },
});

/**
 * Remove roles associated to a repository alias
 * @param {RepositoryAlias} alias - The repository to sync
 * @returns {Promise<void>}
 */
const unmountAlias = async (alias) => {
  const repositoryService = new RepositoriesService();

  /** @type {RepositoryWithAliases} */
  // @ts-ignore
  const repo = await repositoryService.findUnique({
    where: { pattern: alias.target },
    select: { pattern: true, type: true, aliases: true },
  });

  if (!repo) {
    appLogger.error(`[elastic] Cannot unmount alias [${alias.pattern}], repository [${alias.target}] not found`);
    return;
  }

  const readOnlyRole = generateRoleNameFromAlias(alias, repo);

  try {
    await deleteRole(readOnlyRole);
    appLogger.verbose(`[elastic] Role [${readOnlyRole}] has been deleted`);
  } catch (error) {
    appLogger.error(`[elastic] Role [${readOnlyRole}] cannot be deleted:\n${error}`);
  }

  try {
    await deleteAlias(alias.pattern, { ignore: [404] });
    appLogger.verbose(`[elastic] Alias [${alias.pattern}] has been deleted`);
  } catch (error) {
    appLogger.error(`[elastic] Alias [${alias.pattern}] cannot be deleted:\n${error}`);
  }

  const indexTemplateName = getAliasesIndexTemplateName(repo);

  if (repo.aliases.length === 0) {
    try {
      await deleteTemplate(indexTemplateName);
      appLogger.verbose(`[elastic] Index template [${indexTemplateName}] has been deleted (no alias remaining)`);
    } catch (error) {
      appLogger.error(`[elastic] Index template [${indexTemplateName}] cannot be deleted:\n${error}`);
    }
  } else {
    try {
      await upsertIndexTemplate(indexTemplateName, repo);
      appLogger.verbose(`[elastic] Index template [${indexTemplateName}] has been upserted`);
    } catch (error) {
      appLogger.error(`[elastic] Index template [${indexTemplateName}] cannot be upserted:\n${error}`);
    }
  }
};

/**
 * Synchronize a repository alias with Elasticsearch, making sure that associated roles exists
 * @param {RepositoryAlias} alias - The repository to sync
 * @returns {Promise<void>}
 */
const syncRepositoryAlias = async (alias) => {
  const repositoryService = new RepositoriesService();

  /** @type {RepositoryWithAliases} */
  // @ts-ignore
  const repo = await repositoryService.findUnique({
    where: { pattern: alias.target },
    select: { pattern: true, type: true, aliases: true },
  });

  if (!repo) {
    appLogger.error(`[elastic] Cannot create alias [${alias.pattern}], repository [${alias.target}] not found`);
    return;
  }

  const readOnlyRole = generateRoleNameFromAlias(alias, repo);

  try {
    const permissions = new Map([[alias.pattern, generateElasticPermissions({ readonly: true })]]);
    await upsertRole(readOnlyRole, permissions);
    appLogger.verbose(`[elastic] Role [${readOnlyRole}] has been upserted`);
  } catch (error) {
    appLogger.error(`[elastic] Role [${readOnlyRole}] cannot be upserted:\n${error}`);
  }

  let filters;
  if (alias.filters) {
    filters = filtersToESQuery(alias.filters);
  }

  try {
    await upsertAlias(alias.pattern, repo.pattern, filters, { ignore: [404] });
    appLogger.verbose(`[elastic] Alias [${alias.pattern}] has been upserted`);
  } catch (error) {
    appLogger.error(`[elastic] Alias [${alias.pattern}] cannot be upserted:\n${error}`);
  }

  const indexTemplateName = getAliasesIndexTemplateName(repo);

  try {
    await upsertIndexTemplate(indexTemplateName, repo);
    appLogger.verbose(`[elastic] Index template [${indexTemplateName}] has been upserted`);
  } catch (error) {
    appLogger.error(`[elastic] Index template [${indexTemplateName}] cannot be upserted:\n${error}`);
  }

  const spacesService = new SpacesService();

  const spacesOfSameType = await spacesService.findMany({
    where: {
      type: repo.type,
      institution: {
        repositoryAliases: {
          some: {
            pattern: alias.pattern,
          },
        },
      },
    },
  });

  await Promise.allSettled(spacesOfSameType.map((space) => syncIndexPatterns(space)));
};

/**
 * Sync Elastic's roles to ezMESURE's repository aliases
 * @returns {Promise<ThrottledPromisesResult>}
 */
const syncRepositoryAliases = async () => {
  const repositoryAliasesService = new RepositoryAliasesService();
  const aliases = await repositoryAliasesService.findMany({});

  const executors = aliases.map((alias) => () => syncRepositoryAlias(alias));

  const res = await execThrottledPromises(
    executors,
    (error) => appLogger.warn(`[elastic] Error on upserting repository aliases roles: ${error.message}`),
  );
  appLogger.verbose(`[elastic] Upserted ${res.fulfilled} repository aliases roles (${res.errors} errors)`);

  return res;
};

module.exports = {
  unmountAlias,
  syncRepositoryAlias,
  syncRepositoryAliases,
};

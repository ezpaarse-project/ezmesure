// @ts-check
const { createHash } = require('node:crypto');
const { appLogger } = require('../../logger');

const RepositoriesService = require('../../../entities/repositories.service');
const SpacesService = require('../../../entities/spaces.service');

const { mappingSchema } = require('../../../entities/repositories.dto');

const { syncIndexPatterns } = require('../kibana');

const { generateRoleNameFromRepository, generateElasticPermissions } = require('../../../hooks/utils');
const { execThrottledPromises } = require('../../promises');

const { upsertRole, deleteRole } = require('../../elastic/roles');
const { upsertTemplate, deleteTemplate } = require('../../elastic/indices');
const { filtersToESQuery } = require('../../elastic/filters');

/* eslint-disable max-len */
/**
 * @typedef {import('../../promises').ThrottledPromisesResult} ThrottledPromisesResult
 * @typedef {import('../../../.prisma/client').Repository} Repository
 * @typedef {import('../../../.prisma/client').Prisma.RepositoryGetPayload<{ include: { aliases: true } }>} RepositoryWithAliases
 * @typedef {import('@elastic/elasticsearch').default.estypes.MappingTypeMapping} esMapping
 * @typedef {import('@elastic/elasticsearch').default.estypes.MappingProperty} esMappingProperty
 * @typedef {import('@elastic/elasticsearch').default.estypes.IndicesAlias} esIndicesAlias
 */
/* eslint-enable max-len */

// Namespace for index templates dedicated to repositories
const indexTemplatePrefix = 'ezm-tpl';
// Random high priority for index templates
// An index pattern cannot match multiple templates with the same priority
const indexTemplatePriority = 679;
// Metadata added to the templates created by ezMESURE so that we can easily recognize them
const indexTemplateMeta = {
  createdBy: 'ezmesure',
  description: 'Created by the ezMESURE API to keep indices in sync',
};

/**
 * Get the name of the index template for a given repository pattern
 * @param {string} pattern - The repository pattern
 * @returns {string}
 */
const getIndexTemplateName = (pattern) => {
  // Adding a short hash to make sure there cannot be any conflict on index template name
  const hash = createHash('sha1').update(pattern).digest('hex').substring(0, 10);

  return [
    indexTemplatePrefix,
    pattern.replace(/\*/g, ''), // Asterisk not allowed in template names
    hash,
  ].join('_');
};

/**
 * @typedef {object} RepositoryPropertyMapping
 * @property {string} type
 * @property {boolean} ignoreMalformed
 * @property {('date')[]} subFields
 */
/**
 * @typedef {object} RepositoryMapping
 * @property {Record<string, RepositoryPropertyMapping>} properties
 */

/**
 * Transform a property for a repository mapping into a property for a index mapping
 *
 * @param {RepositoryPropertyMapping} property - The property definition
 *
 * @returns {esMappingProperty | undefined}
 */
const repositoryPropertyMappingToIndexPropertyMapping = ({
  type,
  ignoreMalformed,
  subFields,
}) => {
  /** @type {esMappingProperty['fields'] | undefined} */
  let fields;
  if (subFields.length > 0) {
    fields = Object.fromEntries(
      subFields
        .map((field) => {
          if (field === 'date') {
            return ['date', {
              type: 'date',
              ignore_malformed: true,
            }];
          }
          return [];
        })
        // Quietly ignore unsupported properties
        .filter(([, definition]) => !!definition),
    );
  }

  const base = { fields };

  // Handling each type separately to satisfy types
  switch (type) {
    case 'integer':
    case 'float':
    case 'long':
    case 'short':
    case 'double':
    case 'byte':
    case 'date_nanos':
    case 'date':
    case 'geo_point':
    case 'geo_shape':
      // @ts-ignore
      return {
        ...base,
        type,
        ignore_malformed: ignoreMalformed,
      };

    case 'boolean':
    case 'binary':
    case 'keyword':
    case 'text':
    case 'ip':
      // @ts-ignore
      return {
        ...base,
        type,
      };

    default:
      return undefined;
  }
};

/**
 * Transform a mapping for a repository into a mapping for an index
 *
 * @param {RepositoryMapping} mapping - The repository mapping
 *
 * @returns {esMapping | undefined}
 */
const repositoryMappingToIndexMapping = (mapping) => {
  const properties = Object.entries(mapping.properties ?? {})
    .map(([name, property]) => [
      name,
      repositoryPropertyMappingToIndexPropertyMapping(property),
    ])
    // Quietly ignore unsupported properties
    .filter(([, definition]) => !!definition);

  return {
    properties: properties.length > 0 ? Object.fromEntries(properties) : undefined,
  };
};

/**
 * Transform aliases of a repository into aliases for an index
 *
 * @param {RepositoryWithAliases['aliases']} aliases - The aliases of the repository
 *
 * @returns {Record<string, esIndicesAlias> | undefined}
 */
const repositoryAlisesToIndexAliases = (aliases) => {
  const entries = aliases.map((a) => [
    a.pattern,
    Array.isArray(a.filters) && a.filters.length > 0
      ? { filter: filtersToESQuery(a.filters) }
      : {},
  ]);

  if (entries.length > 0) {
    return Object.fromEntries(entries);
  }
  return undefined;
};

/**
 * Upsert an index template that contains aliases for a repository
 * @param {string} name - The name of the index template
 * @param {RepositoryWithAliases} repo - The repository with its aliases
 * @returns {Promise<import('@elastic/elasticsearch/index.js').ApiResponse>}
 */
const upsertIndexTemplate = (name, repo) => {
  const mappings = repositoryMappingToIndexMapping(
    mappingSchema.validate(repo.mapping).value || {},
  );

  const aliases = repositoryAlisesToIndexAliases(repo.aliases);

  return upsertTemplate({
    name,
    create: false,
    body: {
      priority: indexTemplatePriority,
      index_patterns: [repo.pattern],
      _meta: indexTemplateMeta,
      template: {
        mappings,
        aliases,
      },
    },
  });
};

/**
 * Delete the index template of the given repository
 * @param {string} pattern - The repository pattern
 * @returns {Promise<void>}
 */
const deleteRepositoryIndexTemplate = async (pattern) => {
  const indexTemplateName = getIndexTemplateName(pattern);

  try {
    await deleteTemplate(indexTemplateName, { ignore: [404] });
    appLogger.verbose(`[elastic] Index template [${indexTemplateName}] has been deleted`);
  } catch (error) {
    appLogger.error(`[elastic] Index template [${indexTemplateName}] cannot be deleted:\n${error}`);
  }
};

/**
 * Synchronize the index template for the given repository pattern
 * @param {string} pattern - The repository pattern
 * @returns {Promise<void>}
 */
const syncRepositoryIndexTemplate = async (pattern) => {
  const repositoriesService = new RepositoriesService();

  /** @type {RepositoryWithAliases} */
  // @ts-ignore
  const repository = await repositoriesService.findUnique({
    where: { pattern },
    select: { pattern: true, aliases: true, mapping: true },
  });

  if (!repository) {
    return deleteRepositoryIndexTemplate(pattern);
  }

  const indexTemplateName = getIndexTemplateName(pattern);

  try {
    await upsertIndexTemplate(indexTemplateName, repository);
    appLogger.verbose(`[elastic] Index template [${indexTemplateName}] has been upserted`);
  } catch (error) {
    appLogger.error(`[elastic] Index template [${indexTemplateName}] cannot be upserted:\n${error}`);
  }
};

/**
 * Remove roles associated to a repository
 * @param {Repository} repo - The repository to unmount
 * @returns {Promise<void>}
 */
const unmountRepository = async (repo) => {
  const readOnlyRole = generateRoleNameFromRepository(repo, 'readonly');
  const allRole = generateRoleNameFromRepository(repo, 'all');

  try {
    await deleteRole(readOnlyRole);
    appLogger.verbose(`[elastic] Role [${readOnlyRole}] has been deleted`);
  } catch (error) {
    appLogger.error(`[elastic] Role [${readOnlyRole}] cannot be deleted:\n${error}`);
  }

  try {
    await deleteRole(allRole);
    appLogger.verbose(`[elastic] Role [${allRole}] has been deleted`);
  } catch (error) {
    appLogger.error(`[elastic] Role [${allRole}] cannot be deleted:\n${error}`);
  }

  await deleteRepositoryIndexTemplate(repo.pattern);
};

/**
 * Synchronize a repository with Elasticsearch, making sure that associated roles exists
 * @param {Repository} repo - The repository to sync
 * @returns {Promise<void>}
 */
const syncRepository = async (repo) => {
  const readOnlyRole = generateRoleNameFromRepository(repo, 'readonly');
  const allRole = generateRoleNameFromRepository(repo, 'all');

  try {
    const permissions = new Map([[repo.pattern, generateElasticPermissions({ readonly: true })]]);
    await upsertRole(readOnlyRole, permissions);
    appLogger.verbose(`[elastic] Role [${readOnlyRole}] has been upserted`);
  } catch (error) {
    appLogger.error(`[elastic] Role [${readOnlyRole}] cannot be upserted:\n${error}`);
  }

  try {
    const permissions = new Map([[repo.pattern, generateElasticPermissions({ readonly: false })]]);
    await upsertRole(allRole, permissions);
    appLogger.verbose(`[elastic] Role [${allRole}] has been upserted`);
  } catch (error) {
    appLogger.error(`[elastic] Role [${allRole}] cannot be upserted:\n${error}`);
  }

  await syncRepositoryIndexTemplate(repo.pattern);

  const spacesService = new SpacesService();

  const spacesOfSameType = await spacesService.findMany({
    where: {
      type: repo.type,
      institution: {
        repositories: {
          some: {
            pattern: repo.pattern,
          },
        },
      },
    },
  });

  await Promise.allSettled(spacesOfSameType.map((space) => syncIndexPatterns(space)));
};

/**
 * Sync Elastic's roles to ezMESURE's repositories
 * @returns {Promise<ThrottledPromisesResult>}
 */
const syncRepositories = async () => {
  const repositoriesService = new RepositoriesService();
  const repositories = await repositoriesService.findMany({});

  const executors = repositories.map((repo) => () => syncRepository(repo));

  const res = await execThrottledPromises(
    executors,
    (error) => appLogger.warn(`[elastic] Error on upserting repositories roles: ${error.message}`),
  );
  appLogger.verbose(`[elastic] Upserted ${res.fulfilled} repositories roles (${res.errors} errors)`);

  return res;
};

module.exports = {
  syncRepository,
  syncRepositories,
  syncRepositoryIndexTemplate,
  unmountRepository,
};

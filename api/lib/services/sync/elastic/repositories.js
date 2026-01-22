// @ts-check
const { createHash } = require('node:crypto');
const { appLogger } = require('../../logger');

const indexTemplates = require('../../../utils/index-templates');

const RepositoriesService = require('../../../entities/repositories.service');
const SpacesService = require('../../../entities/spaces.service');

const { mappingSchema, settingsSchema } = require('../../../entities/repositories.dto');

const { syncIndexPatterns } = require('../kibana');

const { generateRoleNameFromRepository, generateElasticPermissions } = require('../../../hooks/utils');
const { execThrottledPromises } = require('../../promises');

const { upsertRole, deleteRole } = require('../../elastic/roles');
const { upsertTemplate, deleteTemplate, upsertTemplateComponent } = require('../../elastic/indices');
const { filtersToESQuery } = require('../../elastic/filters');

/* eslint-disable max-len */
/**
 * @typedef {import('../../promises').ThrottledPromisesResult} ThrottledPromisesResult
 * @typedef {import('../../../.prisma/client.mjs').Repository} Repository
 * @typedef {import('../../../.prisma/client.mjs').Prisma.RepositoryGetPayload<{ include: { aliases: true } }>} RepositoryWithAliases
 * @typedef {import('@elastic/elasticsearch').default.estypes.MappingTypeMapping} esMapping
 * @typedef {import('@elastic/elasticsearch').default.estypes.MappingProperty} esMappingProperty
 * @typedef {import('@elastic/elasticsearch').default.estypes.IndicesAlias} esIndicesAlias
 *
 * @typedef {{ repository: RepositoryWithAliases, priority: number }} RepositoryPriority
 */
/* eslint-enable max-len */

/**
 * @typedef {object} RepositoryPropertyMapping
 * @property {string} type
 * @property {boolean} ignoreMalformed
 * @property {string | undefined} format
 * @property {('date')[]} subFields
 */
/**
 * @typedef {object} RepositoryMapping
 * @property {Record<string, RepositoryPropertyMapping>} properties
 */

/**
  * @typedef {object} RepositorySettings
  * @property {string} [defaultPipeline]
  * @property {string} [finalPipeline]
  */

// Namespace for index templates dedicated to repositories
const indexTemplatePrefix = 'ezm-tpl';
// Metadata added to the templates created by ezMESURE so that we can easily recognize them
const indexTemplateMeta = {
  createdBy: 'ezmesure',
  description: 'Created by the ezMESURE API to keep indices in sync',
};
// Namespace for index template components dedicated to repositories
const indexTemplateComponentPrefix = `${indexTemplatePrefix}-cmpnt`;
// Index templates components definitions
const indexTemplateComponentDefinitions = {
  ezpaarse: [
    {
      name: `${indexTemplateComponentPrefix}_ezpaarse`,
      template: indexTemplates.ezpaarse,
    },
  ],
  counter5: [
    {
      name: `${indexTemplateComponentPrefix}_counter-r5`,
      template: indexTemplates.sushi.r5,
      version: '5',
    },
    {
      name: `${indexTemplateComponentPrefix}_counter-r51`,
      template: indexTemplates.sushi.r51,
      version: '5.1',
    },
  ],
};

/**
 * Calculate hash of a repository pattern
 *
 * @param {string} pattern - The repository pattern
 *
 * @returns {string} The hash
 */
const calcHashOfPattern = (pattern) => createHash('sha1')
  .update(pattern)
  .digest('hex')
  .substring(0, 10);

/**
 * Transform repository patterns as RegEx
 *
 * @param {string} pattern - The pattern (wildcard)
 *
 * @returns {RegExp} The RegEx
 */
const patternToRegex = (pattern) => {
  const exp = pattern.replaceAll('*', '.*?');

  return new RegExp(`^${exp}$`, 'i');
};

/**
 * Calculate the priority of a pattern and the priority of the repositories it includes
 *
 * @param {RepositoryWithAliases} targetRepository - The pattern we want the priority
 * @param {RepositoryWithAliases[]} allRepositories - The list containing all repository
 *
 * @returns {RepositoryPriority[]} - The affected patterns with their priority
 */
function calcRepositoryPriorities(targetRepository, allRepositories) {
  // Mimic an index under repository by removing *
  const targetIndex = targetRepository.pattern.replaceAll('*', '');
  const targetRegex = patternToRegex(targetRepository.pattern);

  let parentCount = 0;
  const childRepositories = [];

  // eslint-disable-next-line no-restricted-syntax
  for (const repository of allRepositories) {
    // Mimic an index under repository by removing *
    const index = repository.pattern.replaceAll('*', '');

    // Indices like *-example* and *-example must not be considered as parent and child
    if (index === targetIndex) {
      // eslint-disable-next-line no-continue
      continue;
    }

    const regex = patternToRegex(repository.pattern);

    if (targetRegex.test(index)) {
      childRepositories.push(repository);
    }

    if (regex.test(targetIndex)) {
      parentCount += 1;
    }
  }

  // Priorities before 100 are internal, starting with an offset of 200 gives us some space
  let priority = 200;
  // Add a slight priority boost depending on the pattern length, so that similar patterns like
  // example-* and example* won't be given the same priority if they have the same number of parents
  priority += targetIndex.length * 5;
  // Child patterns must be much more specific than their parents
  priority += parentCount * 1000;
  // Pattern does not start with a wildcard, it's more specific
  if (!targetRepository.pattern.startsWith('*')) {
    priority += 100;
  }
  // If the pattern does not end with a wildcard, it's more specific
  if (!targetRepository.pattern.endsWith('*')) {
    priority += 50;
  }
  // Avoid conflicts between repository types
  if (targetRepository.type === 'counter5') {
    priority += 1;
  }

  const children = childRepositories.flatMap(
    (repository) => calcRepositoryPriorities(repository, allRepositories),
  );

  return [
    { repository: targetRepository, priority },
    ...children,
  ];
}

/**
 * Upsert the index template component matching the repository type
 *
 * It is used as base when creating a new index
 *
 * @param {Repository} repo - The repository
 *
 * @returns {Promise<void>}
 */
const upsertIndexTemplateComponent = async (repo) => {
  const templates = indexTemplateComponentDefinitions[repo.type] ?? [];
  if (templates.length <= 0) {
    throw new Error(`No template(s) found for [${repo.type}]`);
  }

  await Promise.all(
    templates.map(async ({ name, template }) => upsertTemplateComponent({
      name,
      create: false,
      body: {
        template,
        _meta: indexTemplateMeta,
      },
    })),
  );
};

/**
 * Get the names of the index templates for a given repository pattern
 * @param {Repository} repo - The repository
 * @returns {{ name: string, pattern: string, components: any[] }[]} the names of the templates
 */
const getIndexTemplateDefinitions = (repo) => {
  // Adding a short hash to make sure there cannot be any conflict on index template name
  const hash = calcHashOfPattern(repo.pattern);

  const components = indexTemplateComponentDefinitions[repo.type] ?? [];

  if (repo.type === 'ezpaarse') {
    // Asterisk not allowed in template names
    const pattern = repo.pattern.replace(/\*/g, '');

    return [{
      name: `${indexTemplatePrefix}_${pattern}_${hash}`,
      pattern: repo.pattern,
      components: components.map(({ name }) => name),
    }];
  }

  if (repo.type === 'counter5') {
    return components.map((component) => {
      const pattern = RepositoriesService.getCounterIndex(repo.pattern, component.version);

      return {
        name: `${indexTemplatePrefix}_${pattern}_${hash}`,
        pattern,
        components: [component.name],
      };
    });
  }

  return [];
};

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
  format,
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
              ignore_malformed: ignoreMalformed,
              format: format || undefined,
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
    case 'geo_point':
    case 'geo_shape':
      // @ts-ignore
      return {
        ...base,
        type,
        ignore_malformed: ignoreMalformed,
      };

    case 'date':
    case 'date_nanos':
      // @ts-ignore
      return {
        ...base,
        type,
        ignore_malformed: ignoreMalformed,
        format: format || undefined,
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
const repositoryAliasesToIndexAliases = (aliases) => {
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
 * Transform settings of a repository into settings for an index
 *
 * @param {RepositorySettings} settings - The settings of the repository
 *
 * @returns {esIndexSettings}
 */
const repositorySettingsToIndexSettings = (settings) => ({
  default_pipeline: settings.defaultPipeline || undefined,
  final_pipeline: settings.finalPipeline || undefined,
});

/**
 * Upsert an index template that contains aliases for a repository
 * @param {RepositoryWithAliases} repo - The repository with its aliases
 * @param {RepositoryWithAliases[]} allRepositories - The list containing all repository
 * @param {boolean} [skipChildren] - Should skip the child of repository
 * @returns {Promise<void>}
 */
const upsertIndexTemplates = async (repo, allRepositories, skipChildren) => {
  const repositories = calcRepositoryPriorities(repo, allRepositories);

  const repositoriesToUpdate = skipChildren ? [repositories[0]] : repositories;

  await Promise.all(
    repositoriesToUpdate.flatMap(({ repository, priority }) => {
      const mappings = repositoryMappingToIndexMapping(
        mappingSchema.validate(repository.mapping).value || {},
      );

      const aliases = repositoryAliasesToIndexAliases(repository.aliases);

      const settings = repositorySettingsToIndexSettings(
        settingsSchema.validate(repository.settings).value || {},
      );

      const body = {
        priority,
        _meta: indexTemplateMeta,
        template: {
          settings,
          mappings,
          aliases,
        },
      };

      const definitions = getIndexTemplateDefinitions(repository);

      return definitions.map((definition) => {
        appLogger.verbose(`[elastic] Resolved index template [${definition.name}] - priority=[${priority}]`);

        return upsertTemplate({
          name: definition.name,
          create: false,
          body: {
            ...body,
            index_patterns: [definition.pattern],
            composed_of: definition.components,
          },
        });
      });
    }),
  );
};

/**
 * Delete the index template of the given repository
 * @param {string} pattern - The repository pattern
 * @returns {Promise<void>}
 */
const deleteRepositoryIndexTemplates = async (pattern) => {
  const hash = calcHashOfPattern(pattern);

  try {
    await deleteTemplate(`${indexTemplatePrefix}*${hash}`, { ignore: [404] });
    appLogger.verbose(`[elastic] Index templates of [${pattern}] has been deleted`);
  } catch (error) {
    appLogger.error(`[elastic] Index template of [${pattern}] cannot be deleted:\n${error}`);
  }
};

/**
 * Synchronize the index template for the given repository pattern
 * @param {string} pattern - The repository pattern
 * @param {RepositoryWithAliases[]} [allRepositories] - The list containing all repository
 * @returns {Promise<void>}
 */
const syncRepositoryIndexTemplates = async (pattern, allRepositories = []) => {
  const repositoriesService = new RepositoriesService();

  let repoList = allRepositories;
  if (allRepositories.length <= 0) {
    // @ts-expect-error
    repoList = await repositoriesService.findMany({
      select: {
        pattern: true,
        type: true,
        aliases: true,
        mapping: true,
        settings: true,
      },
    });
  }

  /** @type {RepositoryWithAliases} */
  // @ts-ignore
  const repository = repoList.find((repo) => repo.pattern === pattern);
  if (!repository) {
    return deleteRepositoryIndexTemplates(pattern);
  }

  try {
    await upsertIndexTemplateComponent(repository);
    appLogger.verbose(`[elastic] Index template components for type [${repository.type}] has been upserted`);
  } catch (error) {
    appLogger.error(`[elastic] Index template components for type [${repository.type}] cannot be upserted:\n${error}`);
  }

  try {
    // If allRepositories is specified, we're updating every repositories
    // so we don't need to update children of repositories
    await upsertIndexTemplates(repository, repoList, allRepositories.length > 0);
    appLogger.verbose(`[elastic] Index templates for [${repository.pattern}] has been upserted`);
  } catch (error) {
    appLogger.error(`[elastic] Index templates for [${repository.pattern}] cannot be upserted:\n${error}`);
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

  await deleteRepositoryIndexTemplates(repo.pattern);
};

/**
 * Synchronize a repository with Elasticsearch, making sure that associated roles exists
 * @param {Repository} repo - The repository to sync
 * @param {RepositoryWithAliases[]} [allRepositories] - The list containing all repository
 * @returns {Promise<void>}
 */
const syncRepository = async (repo, allRepositories) => {
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

  await syncRepositoryIndexTemplates(repo.pattern, allRepositories);

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

  const repositories = await repositoriesService.findMany({
    include: { aliases: true },
    orderBy: { pattern: 'asc' },
  });

  // @ts-expect-error/
  const executors = repositories.map((repo) => () => syncRepository(repo, repositories));

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
  syncRepositoryIndexTemplates,
  unmountRepository,
};

// @ts-check
const { registerHook } = require('../hookEmitter');

const { appLogger } = require('../../services/logger');

const {
  syncRepositoryAlias,
  unmountAlias,
  syncRepositoryIndexTemplate,
} = require('../../services/sync/elastic');

/**
 * @typedef {import('@prisma/client').RepositoryAlias} RepositoryAlias
 */

/**
 * @param {RepositoryAlias} repositoryAlias
 */
const onRepositoryAliasUpsert = async (repositoryAlias) => {
  try {
    await syncRepositoryAlias(repositoryAlias);
  } catch (error) {
    appLogger.error(
      `[elastic][hooks] RepositoryAlias [${repositoryAlias?.pattern}] could not be synchronized:\n${error}`,
    );
  }
};

/**
 * @param {RepositoryAlias} repositoryAlias
 */
const onRepositoryAliasDelete = async (repositoryAlias) => {
  try {
    await unmountAlias(repositoryAlias);
  } catch (error) {
    appLogger.error(
      `[elastic][hooks] RepositoryAlias [${repositoryAlias?.pattern}] could not be unmounted:\n${error}`,
    );
  }
};

/**
 * @param {RepositoryAlias} repositoryAlias
 */
const syncTargetIndexTemplate = async (repositoryAlias) => {
  try {
    await syncRepositoryIndexTemplate(repositoryAlias.target);
  } catch (error) {
    appLogger.error(
      `[elastic][hooks] Index template for repository [${repositoryAlias?.target}] could not be synced:\n${error}`,
    );
  }
};

const hookOptions = { uniqueResolver: (repositoryAlias) => repositoryAlias.pattern };
const debounceByTarget = { uniqueResolver: (repositoryAlias) => repositoryAlias.target };

registerHook('repository_alias:create', onRepositoryAliasUpsert, hookOptions);
registerHook('repository_alias:update', onRepositoryAliasUpsert, hookOptions);
registerHook('repository_alias:upsert', onRepositoryAliasUpsert, hookOptions);
registerHook('repository_alias:delete', onRepositoryAliasDelete, hookOptions);

// Sync of repository index template is debounced by target repository pattern
// That way we avoid spamming template syncs when a lot of aliases are created or removed at once
registerHook('repository_alias:create', syncTargetIndexTemplate, debounceByTarget);
registerHook('repository_alias:update', syncTargetIndexTemplate, debounceByTarget);
registerHook('repository_alias:upsert', syncTargetIndexTemplate, debounceByTarget);
registerHook('repository_alias:delete', syncTargetIndexTemplate, debounceByTarget);

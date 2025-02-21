// @ts-check
const { registerHook } = require('../hookEmitter');

const { appLogger } = require('../../services/logger');

const {
  syncAlias,
  unmountAlias,
} = require('../../services/sync/elastic');

/**
 * @typedef {import('@prisma/client').RepositoryAlias} RepositoryAlias
 */

/**
 * @param {RepositoryAlias} repositoryAlias
 */
const onRepositoryAliasUpsert = async (repositoryAlias) => {
  try {
    await syncAlias(repositoryAlias);
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

const hookOptions = { uniqueResolver: (repositoryAlias) => repositoryAlias.pattern };

registerHook('repository_alias:create', onRepositoryAliasUpsert, hookOptions);
registerHook('repository_alias:update', onRepositoryAliasUpsert, hookOptions);
registerHook('repository_alias:upsert', onRepositoryAliasUpsert, hookOptions);
registerHook('repository_alias:delete', onRepositoryAliasDelete, hookOptions);

// @ts-check
const { registerHook } = require('../hookEmitter');

const { appLogger } = require('../../services/logger');
const elastic = require('../../services/elastic');

const {
  syncRepository,
  unmountRepository,
} = require('../../services/sync/elastic/repositories');

/**
 * @typedef {import('../../.prisma/client.mjs').Repository} Repository
 */

/**
 * @param { Repository } repository
 */
const onRepositoryCreate = async (repository) => {
  try {
    await syncRepository(repository);
  } catch (error) {
    appLogger.error(
      `[elastic][hooks] Repository [${repository?.pattern}] could not be synchronized:\n${error}`,
    );
  }

  // Create default index (allowing for spaces using this repository to not throw errors)
  // The index can be manually deleted later
  const index = repository?.pattern.replace(/[*]/g, '');
  try {
    await elastic.indices.create({ index });
    appLogger.verbose(`[elastic][hooks] Created default index for repository [${repository?.pattern}]: ${index}`);
  } catch (error) {
    appLogger.warn(`[elastic][hooks] Could not create default index for repository [${repository?.pattern}] (tried to create [${index}]): ${error}`);
  }
};

/**
 * @param { Repository } repository
 */
const onRepositoryUpsert = async (repository) => {
  try {
    await syncRepository(repository);
  } catch (error) {
    appLogger.error(
      `[elastic][hooks] Repository [${repository?.pattern}] could not be synchronized:\n${error}`,
    );
  }
};

/**
 * @param { Repository } repository
 */
const onRepositoryDelete = async (repository) => {
  try {
    await unmountRepository(repository);
  } catch (error) {
    appLogger.error(
      `[elastic][hooks] Repository [${repository?.pattern}] could not be unmounted:\n${error}`,
    );
  }
};

const hookOptions = { uniqueResolver: (repository) => repository.pattern };

registerHook('repository:create', onRepositoryCreate, hookOptions);
registerHook('repository:update', onRepositoryUpsert, hookOptions);
registerHook('repository:upsert', onRepositoryUpsert, hookOptions);
registerHook('repository:delete', onRepositoryDelete, hookOptions);

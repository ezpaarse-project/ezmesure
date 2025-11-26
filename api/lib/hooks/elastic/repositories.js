// @ts-check
const { registerHook } = require('../hookEmitter');

const { appLogger } = require('../../services/logger');

const {
  syncRepository,
  unmountRepository,
} = require('../../services/sync/elastic');

/**
 * @typedef {import('../../.prisma/client').Repository} Repository
 */

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

registerHook('repository:create', onRepositoryUpsert, hookOptions);
registerHook('repository:update', onRepositoryUpsert, hookOptions);
registerHook('repository:upsert', onRepositoryUpsert, hookOptions);
registerHook('repository:delete', onRepositoryDelete, hookOptions);

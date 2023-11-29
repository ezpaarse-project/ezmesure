// @ts-check
const { appLogger } = require('../logger');

const {
  syncRepositories,
  syncUsers,
} = require('./elastic');

const {
  syncSpaces,
} = require('./kibana');

const ezr = require('./ezreeport');

/**
 * @typedef {object} EntitySyncResult
 * @property {number} synchronized - Number of items that were synchronized
 * @property {number} errors - Number of items that failed to be synchronized
 */

/**
 * @typedef {object} SyncResult
 * @property {EntitySyncResult} spaces - Result of spaces synchronization
 * @property {EntitySyncResult} repositories - Result of repositories synchronization
 * @property {EntitySyncResult} users - Result of users synchronization
 * @property {EntitySyncResult} ezreeportUsers - Result of ezreeport's users synchronization
 * @property {EntitySyncResult} ezreeportNamespaces - Result of ezreeport's namespaces sync
 */

/**
 * @typedef {object} SyncStatus
 * @property {Date | null} startedAt - When the synchronization started
 * @property {number} runningTime - Running time of the synchronization, in milliseconds
 * @property {boolean} hasErrors - Whether the synchronization contains errors
 * @property {'idle'|'synchronizing'|'completed'} status - Status of the synchronization
 * @property {SyncResult} result - Synchronization result
 */

/** @type {SyncStatus} */
const syncStatus = {
  startedAt: null,
  runningTime: 0,
  status: 'idle',
  hasErrors: false,
  result: {
    spaces: { errors: 0, synchronized: 0 },
    repositories: { errors: 0, synchronized: 0 },
    users: { errors: 0, synchronized: 0 },
    ezreeportUsers: { errors: 0, synchronized: 0 },
    ezreeportNamespaces: { errors: 0, synchronized: 0 },
  },
};

function isSynchronizing() {
  return syncStatus.status === 'synchronizing';
}

function getStatus() {
  return syncStatus;
}

/**
 * Start a global synchronization with Elasticsearch and Kibana
 * @returns {Promise<void>}
 */
async function startSync() {
  if (isSynchronizing()) { return; }

  syncStatus.startedAt = new Date();
  syncStatus.status = 'synchronizing';
  syncStatus.runningTime = 0;
  syncStatus.hasErrors = false;

  syncStatus.result = {
    spaces: { errors: 0, synchronized: 0 },
    repositories: { errors: 0, synchronized: 0 },
    users: { errors: 0, synchronized: 0 },
    ezreeportUsers: { errors: 0, synchronized: 0 },
    ezreeportNamespaces: { errors: 0, synchronized: 0 },
  };

  /**
   * @param {keyof SyncResult} itemType
   * @param {import('../promises').ThrottledPromisesResult} res
   */
  const setSyncResult = (itemType, res) => {
    if (Number.isInteger(res?.errors) && res.errors > 0) {
      syncStatus.hasErrors = true;
    }

    syncStatus.result[itemType] = {
      synchronized: res?.fulfilled || 0,
      errors: res?.errors || 0,
    };
  };

  // Sync spaces in Kibana
  try {
    appLogger.info('[sync] Synchronizing spaces...');
    setSyncResult('spaces', await syncSpaces());
  } catch (e) {
    setSyncResult('spaces', { fulfilled: 0, errors: 1 });
    appLogger.error(`[sync] An error occurred during spaces synchronization: ${e}`);
  }

  // Sync repos in Elastic
  try {
    appLogger.info('[sync] Synchronizing repositories...');
    setSyncResult('repositories', await syncRepositories());
  } catch (e) {
    setSyncResult('repositories', { fulfilled: 0, errors: 1 });
    appLogger.error(`[sync] An error occurred during repositories synchronization: ${e}`);
  }

  // Sync users in Elastic
  try {
    appLogger.info('[sync] Synchronizing users...');
    setSyncResult('users', await syncUsers());
  } catch (e) {
    setSyncResult('users', { fulfilled: 0, errors: 1 });
    appLogger.error(`[sync] An error occurred during users synchronization: ${e}`);
  }

  // Sync users in ezREEPORT
  try {
    appLogger.info('[sync] Synchronizing ezreeport users...');
    setSyncResult('ezreeportUsers', await ezr.syncUsers());
  } catch (e) {
    setSyncResult('ezreeportUsers', { fulfilled: 0, errors: 1 });
    appLogger.error(`[sync] An error occurred during ezreeport users synchronization: ${e}`);
  }

  // Sync namespaces in ezREEPORT
  try {
    appLogger.info('[sync] Synchronizing ezreeport namespaces...');
    setSyncResult('ezreeportNamespaces', await ezr.syncNamespaces());
  } catch (e) {
    setSyncResult('ezreeportNamespaces', { fulfilled: 0, errors: 1 });
    appLogger.error(`[sync] An error occurred during ezreeport namespaces synchronization: ${e}`);
  }

  syncStatus.status = 'completed';
  syncStatus.runningTime = Date.now() - syncStatus.startedAt.getTime();
}

module.exports = {
  startSync,
  isSynchronizing,
  getStatus,
};

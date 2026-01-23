// @ts-check
const { registerHook } = require('../hookEmitter');

const { appLogger } = require('../../services/logger');

const elasticUsers = require('../../services/elastic/users');
const { syncApiKey } = require('../../services/sync/elastic/api-keys');
const { generateUsernameFromApiKey } = require('../utils');

/**
 * @typedef {import('../../.prisma/client.mjs').ApiKey} ApiKey
 * @typedef {import('../../.prisma/client.mjs').ElasticRole} ElasticRole
 */

/**
  * @param {ApiKey} apiKey
  */
const onApiKeyUpsert = async (apiKey) => {
  try {
    const username = await syncApiKey(apiKey);
    appLogger.verbose(`[elastic][hooks] User [${username}] (for api key [${apiKey.id}]) is upserted`);
  } catch (error) {
    appLogger.error(`[elastic][hooks] User for api key [${apiKey.id}] cannot be upserted: ${error.message}`);
  }
};

/**
 * @param {ApiKey} apiKey
 */
const onApiKeyDelete = async (apiKey) => {
  try {
    const username = generateUsernameFromApiKey(apiKey);
    await elasticUsers.deleteUser(username);
    appLogger.verbose(`[elastic][hooks] User [${username}] (for api key [${apiKey.id}]) is deleted`);
  } catch (error) {
    appLogger.error(`[elastic][hooks] User for api key [${apiKey.id}] cannot be deleted: ${error.message}`);
  }
};

registerHook('api-key:create', onApiKeyUpsert);
registerHook('api-key:update', onApiKeyUpsert);
registerHook('api-key:upsert', onApiKeyUpsert);
registerHook('api-key:delete', onApiKeyDelete);

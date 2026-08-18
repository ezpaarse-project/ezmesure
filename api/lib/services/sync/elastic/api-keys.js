// @ts-check
const { appLogger } = require('../../logger');

const ApiKeysService = require('../../../entities/api-key.service');

const { generateUsernameFromApiKey, generateApiKeyRoles } = require('../../../hooks/utils');
const { execThrottledPromises } = require('../../promises');

const { upsertUser } = require('../../elastic/users');

/**
 * @typedef {import('../../promises').ThrottledPromisesResult} ThrottledPromisesResult
 * @typedef {import('../../.prisma/client.mjs').ApiKey} ApiKey
 * @typedef {import('@elastic/elasticsearch').estypes.SecurityUser} ElasticUser
 */

/**
 * Sync an api key by creating a user in Elasticsearch with proper roles
 *
 * @param {ApiKey} apiKey - The api key to synchronize
 *
 * @returns {Promise<string>} - The username of the user
 */
const syncApiKey = async (apiKey) => {
  const username = generateUsernameFromApiKey(apiKey);
  const roles = await generateApiKeyRoles(apiKey.id);

  await upsertUser({
    username,
    email: `${apiKey.institutionId}@example.com`,
    fullName: username.split('.').slice(1).join(' '),
    roles,
    metadata: {},
  });

  return username;
};

/**
 * Sync Elastic's users' roles to ezMESURE's memberships
 * @returns {Promise<ThrottledPromisesResult>}
 */
const syncApiKeys = async () => {
  const service = new ApiKeysService();
  const apiKeys = await service.findMany({});

  const executors = apiKeys.map(
    (apiKey) => async () => syncApiKey(apiKey),
  );

  const res = await execThrottledPromises(
    executors,
    (error) => appLogger.warn(`[elastic] Error on upserting roles for api keys: ${error.message}`),
  );
  appLogger.verbose(`[elastic] Upserted roles for ${res.fulfilled} api keys (${res.errors} errors)`);
  return res;
};

module.exports = {
  syncApiKey,
  syncApiKeys,
};

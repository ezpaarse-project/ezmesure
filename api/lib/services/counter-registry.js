const { ofetch } = require('ofetch');
const config = require('config');

const { createCache } = require('../utils/cache-manager');

const registry = ofetch.create({
  baseURL: config.get('counter.registryUrl'),
});

const cache = createCache(config.get('cache.duration.counterRegistry'));

/**
 * Get all platforms from counter registry, and cache them for 1 day
 *
 * @returns {Promise<object[]>}
 */
async function getAllPlatforms() {
  const cached = await cache.get('platforms:*');
  if (cached) {
    return cached;
  }

  const data = await registry('/api/v1/platform');
  await cache.set('platforms:*', data);

  return data;
}

/**
 * Get specific platform from counter registry, and cache them for 1 hour
 *
 * @param {string} id Id of the platform
 *
 * @returns {Promise<object>}
 */
async function getPlatform(id) {
  const cached = await cache.get(`platforms:${id}`);
  if (cached) {
    return cached;
  }

  const data = await registry(`/api/v1/platform/${id}`);
  await cache.set(`platforms:${id}`, data, 3600 * 1000);

  return data;
}

/**
 * Get specific data host, and cache them for 1 day
 *
 * @param {string} id Id of the data host
 *
 * @returns {Promise<object>}
 */
async function getDataHost(id) {
  const cached = await cache.get(`data-hosts:${id}`);
  if (cached) {
    return cached;
  }

  const data = await registry(`/api/v1/usage-data-host/${id}`);
  await cache.set(`data-hosts:${id}`, data);

  return data;
}

module.exports = {
  getAllPlatforms,
  getPlatform,
  getDataHost,
};

const { ofetch } = require('ofetch');
const { createCache } = require('../utils/cache-manager');

const registry = ofetch.create({
  baseURL: 'https://registry.countermetrics.org/api/v1',
});

const cache = createCache(24 * 3600 * 1000);

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

  const data = await registry('/platform');
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

  const data = await registry(`/platform/${id}`);
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

  const data = await registry(`/usage-data-host/${id}`);
  await cache.set(`data-hosts:${id}`, data);

  return data;
}

module.exports = {
  getAllPlatforms,
  getPlatform,
  getDataHost,
};

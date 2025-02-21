const { isValid, isBefore, addHours } = require('date-fns');

const registry = require('axios').create({
  baseURL: 'https://registry.countermetrics.org/api/v1',
});

/** @type {{ cachedAt: Date, platforms: object[] } | undefined} */
let platformsCache;
/** @type {Map<string, { cachedAt: Date, dataHost: object }>} */
const dataHostCache = new Map();

/**
 * Check if cache is invalid, cache lasts 1 hour
 *
 * @param {Date | undefined} cachedAt
 *
 * @returns {boolean}
 */
const isCacheInvalid = (cachedAt) => !cachedAt
  || !isValid(cachedAt)
  || isBefore(addHours(cachedAt, 1), new Date());

/**
 * Get all platforms from counter registry, and cache them for 1 hour
 *
 * @returns {Promise<object[]>}
 */
async function getAllPlatforms() {
  if (isCacheInvalid(platformsCache?.cachedAt)) {
    const { data } = await registry.get('/platform');
    platformsCache = {
      platforms: data,
      cachedAt: new Date(),
    };
  }

  return platformsCache.platforms;
}

/**
 * Get specific platform from counter registry
 *
 * We don't use cache to get newest data
 *
 * @param {string} id Id of the platform
 *
 * @returns {Promise<object>}
 */
async function getPlatform(id) {
  const { data } = await registry.get(`/platform/${id}`);
  return data;
}

/**
 * Get specific data host, and cache them for 1 hour
 *
 * @param {string} id Id of the data host
 *
 * @returns {Promise<object>}
 */
async function getDataHost(id) {
  let { dataHost, cachedAt } = dataHostCache.get(id) ?? {};
  if (isCacheInvalid(cachedAt)) {
    ({ data: dataHost } = await registry.get(`/usage-data-host/${id}`));
    cachedAt = new Date();

    dataHostCache.set(id, { dataHost, cachedAt });
  }
  return dataHost;
}

/**
 * Strip known counter version from url
 *
 * @param {string} url The url of the endpoint
 * @param {string} version The version of the endpoint
 *
 * @returns {string} URL without known counter version
 */
function stripCounterVersionFromUrl(url, version) {
  let result = url;
  if (version.startsWith('5.1')) {
    result = url.replace(/\/r51\/?$/, '/');
  }

  return result.replace(/\/$/, '');
}

module.exports = {
  getAllPlatforms,
  getPlatform,
  getDataHost,
  stripCounterVersionFromUrl,
};

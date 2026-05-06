// @ts-check
const { createCache } = require('cache-manager');

/**
 * Create a cache store
 *
 * @param {number} [ttl] - The global ttl of the store
 *
 * @returns The store
 */
module.exports.createCache = (ttl) => createCache({
  ttl,
});

// @ts-check

const fsp = require('fs/promises');
const path = require('path');

const cacheMap = new Map();

/**
 * Load asset and cache it
 *
 * @param {string} filepath The path to the asset (from `./assets`)
 * @param {Object} opts Various options
 * @param {BufferEncoding} [opts.encoding] `base64` by default
 * @param {boolean} [opts.cache] `true` by default
 *
 * @returns {Promise<any>} The asset in given encoding
 */
const loadAsset = async (filepath, opts = {}) => {
  const encoding = opts.encoding ?? 'base64';
  const shouldUseCache = opts.cache !== false;

  const cached = cacheMap.get(filepath);
  if (shouldUseCache && cached) {
    return cached;
  }

  const asset = await fsp.readFile(path.resolve('assets', filepath), { encoding });
  if (shouldUseCache) {
    cacheMap.set(filepath, asset);
  }
  return asset;
};

module.exports = {
  loadAsset,
};

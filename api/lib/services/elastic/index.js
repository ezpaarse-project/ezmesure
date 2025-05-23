const { Client } = require('@elastic/elasticsearch');
const config = require('config');
const { URL } = require('url');

const username = config.get('elasticsearch.user');
const password = config.get('elasticsearch.password');
const host = config.get('elasticsearch.host');
const port = config.get('elasticsearch.port');
const scheme = config.get('elasticsearch.scheme');
const url = config.get('elasticsearch.url');

/* eslint-disable max-len */
/**
 * @template T
 * @typedef {import('@elastic/elasticsearch/lib/Transport.d.ts').TransportRequestPromise<T>} TransportRequestPromise
*/
/**
 * @template T
 * @typedef {import('@elastic/elasticsearch/lib/Transport.d.ts').ApiResponse<T, unknown>} ApiResponse
  */
/**
 * @template T
 * @typedef {TransportRequestPromise<ApiResponse<T>>} ESResponse
  */
/* eslint-enable max-len */

const client = new Client({
  node: {
    url: url ? new URL(url) : new URL(`${scheme}://${host}:${port}`),
    auth: {
      username,
      password,
    },
  },
  ssl: {
    rejectUnauthorized: false,
  },
});

client.extend('security.findUser', ({ makeRequest, ConfigurationError }) => (params, opts) => {
  const { username: name } = params;
  const options = opts || {};

  if (!name) {
    throw new ConfigurationError('Missing required parameter: username');
  }

  if (!options.ignore) {
    options.ignore = [404];
  }

  return makeRequest({
    method: 'GET',
    path: `/_security/user/${name}`,
  }, options).then(({ body }) => body && body[name]);
});

module.exports = client;

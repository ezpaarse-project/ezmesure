const { Client } = require('@elastic/elasticsearch');
const config = require('config');
const { URL } = require('url');

const username = config.get('elasticsearch.user');
const password = config.get('elasticsearch.password');
const host = config.get('elasticsearch.host');
const port = config.get('elasticsearch.port');

const client = new Client({
  node: {
    url: new URL(`http://${host}:${port}`),
    auth: {
      username,
      password,
    },
  },
});

client.extend('security.findUser', ({ makeRequest, ConfigurationError }) => function (params, options) {
  const { username } = params;
  options = options || {};

  if (!username) {
    throw new ConfigurationError('Missing required parameter: username');
  }

  if (!options.ignore) {
    options.ignore = [404];
  }

  return makeRequest({
    method: 'GET',
    path: `/_security/user/${username}`,
  }, options).then(({ body }) => body && body[username]);
});

module.exports = client;

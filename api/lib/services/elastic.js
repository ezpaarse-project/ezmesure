const { Client } = require('@elastic/elasticsearch')
const config = require('config');

const user     = config.get('elasticsearch.user');
const password = config.get('elasticsearch.password');
const host     = config.get('elasticsearch.host');
const port     = config.get('elasticsearch.port');

const client = new Client({
  node: `http://${user}:${password}@${host}:${port}`
});

client.extend('security.findUser', ({ makeRequest, ConfigurationError }) => {
  return function (params, options) {
    const { username } = params;
    options = options || {};

    if (!username) {
      throw new ConfigurationError('Missing required parameter: username')
    }

    if (!options.ignore) {
      options.ignore = [404];
    }

    return makeRequest({
      method: 'GET',
      path: `/_security/user/${username}`
    }, options).then(({ body }) => body && body[username]);
  };
});

module.exports = client;

const axios = require('axios');
const config = require('config');

const username = config.get('elasticsearch.user');
const password = config.get('elasticsearch.password');
const host = config.get('kibana.host');
const port = config.get('kibana.port');

const authString = Buffer.from(`${username}:${password}`).toString('base64');

const allowNotFound = (status) => ((status >= 200 && status < 300) || status === 404);

const axiosClient = axios.create({
  baseURL: `http://${host}:${port}`,
  headers: {
    Authorization: `Basic ${authString}`,
    // Kibana won't accept any request without this
    'kbn-xsrf': true,
  },
});

const client = {};

client.getSpace = (id) => {
  if (!id) {
    throw new Error('Missing required parameter: id');
  }

  return axiosClient.get(`/api/spaces/space/${id}`, { validateStatus: allowNotFound });
};

client.createSpace = (opts) => {
  const options = opts || {};

  if (!options.id) {
    throw new Error('Missing required parameter: id');
  }
  if (!options.name) {
    throw new Error('Missing required parameter: name');
  }

  return axiosClient.post('/api/spaces/space', options);
};

client.updateSpace = (opts) => {
  const options = opts || {};

  if (!options.id) {
    throw new Error('Missing required parameter: id');
  }
  if (!options.name) {
    throw new Error('Missing required parameter: name');
  }

  return axiosClient.put(`/api/spaces/space/${options.id}`, options);
};

client.putRole = (opts) => {
  const options = opts || {};

  if (!options.name) {
    throw new Error('Missing required parameter: name');
  }

  return axiosClient.put(`/api/security/role/${options.name}`, options.body || {});
};

client.createIndexPattern = (spaceId, opts) => {
  const attributes = opts || {};

  if (!attributes.title) {
    throw new Error('Missing required parameter: title');
  }
  if (!attributes.timeFieldName) {
    throw new Error('Missing required parameter: timeFieldName');
  }

  return axiosClient.post(`/s/${spaceId}/api/saved_objects/index-pattern`, { attributes });
};

client.getIndexPatterns = (spaceId, opts) => {
  const options = opts || {};
  const params = {
    type: 'index-pattern',
    page: options.page || 1,
    per_page: options.perPage || 50,
  };

  return axiosClient.get(`/s/${spaceId}/api/saved_objects/_find`, { params });
};

module.exports = client;

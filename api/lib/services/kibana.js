const axios = require('axios');
const config = require('config');
const qs = require('qs');

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
  paramsSerializer: (params) => qs.stringify(params, { arrayFormat: 'repeat' }),
});

const client = {};

client.getSpaces = () => axiosClient.get('/api/spaces/space');

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

client.getObject = (options) => {
  const {
    type,
    id,
    spaceId,
  } = options || {};

  const spacePrefix = spaceId ? `/s/${spaceId}` : '';
  return axiosClient.get(`${spacePrefix}/api/saved_objects/${type}/${id}`, { validateStatus: allowNotFound });
};

client.findObjects = (options) => {
  const {
    type,
    spaceId,
    page,
    perPage,
  } = options || {};

  const spacePrefix = spaceId ? `/s/${spaceId}` : '';
  const params = {
    type,
    page: page || 1,
    per_page: perPage || 50,
  };

  return axiosClient.get(`${spacePrefix}/api/saved_objects/_find`, { params });
};

client.exportDashboard = (opts) => {
  const {
    dashboardId, // Can be an array
    spaceId,
  } = opts || {};

  const spacePrefix = spaceId ? `/s/${spaceId}` : '';
  const params = {
    dashboard: dashboardId,
  };

  return axiosClient.get(`${spacePrefix}/api/kibana/dashboards/export`, { params });
};

client.importDashboard = (opts) => {
  const {
    data,
    spaceId,
    force,
  } = opts || {};

  const spacePrefix = spaceId ? `/s/${spaceId}` : '';
  const params = {
    force: !!force,
  };

  return axiosClient.post(`${spacePrefix}/api/kibana/dashboards/import`, data, { params });
};

module.exports = client;

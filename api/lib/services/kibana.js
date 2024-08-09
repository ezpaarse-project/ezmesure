// @ts-check
const { default: axios } = require('axios');
const config = require('config');
const qs = require('qs');

const username = config.get('elasticsearch.user');
const password = config.get('elasticsearch.password');
const host = config.get('kibana.host');
const port = config.get('kibana.port');

const authString = Buffer.from(`${username}:${password}`).toString('base64');

/**
 * @template T
 * @typedef {import('axios').AxiosResponse<T>} AxiosResponse<T>
*/

/**
 * @typedef {import('axios').AxiosInstance} AxiosInstance
 *
 *
 * @typedef {{ statusCode: number, error: string, message: string }} KibanaError
 *
 * @typedef {{ spaces?: string[], base?: string[], feature?: Object }} KibanaPrivileges
 * @typedef {{ name: string, elasticsearch?: Object, kibana: KibanaPrivileges[] }} KibanaRole
 *
 * @typedef {{
 *  id: string,
 *  name: string,
 *  description?: string,
 *  initials?: string,
 *  imageUrl?: string,
 *  color?: string
 * }} KibanaSpace
 *
 * @typedef {{ id: string, type: string, attributes: Object, updated_at?: string }} KibanaObject
 * @typedef {{ saved_objects: KibanaObject[], total: number, page: number }} KibanaFoundObjects
 */

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

const DEFAULT_SPACE = 'default';

/**
 * Get all spaces
 *
 * @returns {Promise<AxiosResponse<KibanaSpace[]>>}
 *
 * @see https://www.elastic.co/guide/en/kibana/7.17/spaces-api-get-all.html
 */
const getSpaces = () => axiosClient.get('/api/spaces/space');

/**
 * Get a kibana space using given id
 *
 * @param {string} id The id of the space
 *
 * @returns {Promise<AxiosResponse<KibanaSpace | KibanaError>>} The space or the error
 *
 * @see https://www.elastic.co/guide/en/kibana/7.17/spaces-api-get.html
 */
const getSpace = (id) => {
  if (!id) {
    throw new Error('Missing required parameter: id');
  }

  return axiosClient.get(`/api/spaces/space/${id}`, { validateStatus: allowNotFound });
};

/**
 * Create a kibana space
 *
 * @param {KibanaSpace} opts The kibana space
 *
 * @returns {Promise<AxiosResponse<KibanaSpace>>} The space
 *
 * @see https://www.elastic.co/guide/en/kibana/7.17/spaces-api-post.html
 */
const createSpace = (opts) => {
  const options = opts || {};

  if (!options.id) {
    throw new Error('Missing required parameter: id');
  }
  if (!options.name) {
    throw new Error('Missing required parameter: name');
  }

  return axiosClient.post('/api/spaces/space', options);
};

/**
 * Updates a kibana space
 *
 * @param {KibanaSpace} opts The kibana space
 *
 * @returns {Promise<AxiosResponse<KibanaSpace>>} The space
 *
 * @see https://www.elastic.co/guide/en/kibana/7.17/spaces-api-put.html
 */
const updateSpace = (opts) => {
  const options = opts || {};

  if (!options.id) {
    throw new Error('Missing required parameter: id');
  }
  if (!options.name) {
    throw new Error('Missing required parameter: name');
  }

  return axiosClient.put(`/api/spaces/space/${options.id}`, options);
};

/**
 * Updates kibana settings
 *
 * @param {Record<string, any> & { id: string }} opts The kibana settings
 *
 * @returns {Promise<AxiosResponse<Record<string, any>>>} The space
 *
 * @see https://www.elastic.co/guide/en/kibana/7.17/advanced-options.html
 */
const updateSpaceSettings = (opts) => {
  const { id, changes } = opts || {};

  if (!id) {
    throw new Error('Missing required parameter: id');
  }

  return axiosClient.post(`/s/${id}/api/kibana/settings`, { changes });
};

/**
 * Delete a kibana space
 *
 * @param {string} spaceId The id of the space
 *
 * @returns {Promise<AxiosResponse<null>>}
 *
 * @see https://www.elastic.co/guide/en/kibana/7.17/spaces-api-delete.html
 */
const deleteSpace = (spaceId) => {
  if (!spaceId) {
    throw new Error('Missing required parameter: spaceId');
  }

  return axiosClient.delete(`/api/spaces/space/${spaceId}`);
};

/**
 * Create or update role using given name
 *
 * @param {Object} opts
 * @param {string} opts.name The name of the role
 * @param {Omit<KibanaRole, 'name'>} opts.body Content of the request
 *
 * @returns {Promise<AxiosResponse<null>>}
 *
 * @see https://www.elastic.co/guide/en/kibana/7.17/role-management-api-put.html
 */
const putRole = (opts) => {
  const options = opts || {};

  if (!options.name) {
    throw new Error('Missing required parameter: name');
  }
  return axiosClient.put(`/api/security/role/${options.name}`, options.body || {});
};

/**
 * Delete role using given name
 *
 * @param {string} name The name of the role
 *
 * @returns {Promise<AxiosResponse<null>>}
 *
 * @see https://www.elastic.co/guide/en/kibana/7.17/role-management-api-delete.html
 */
const deleteRole = (name) => {
  if (!name) {
    throw new Error('Missing required parameter: name');
  }

  return axiosClient.delete(`/api/security/role/${name}`);
};

/**
 * Get role using given name
 *
 * @param {string} name The name of the role
 *
 * @returns {Promise<AxiosResponse<KibanaRole | KibanaError>>} The role or the error
 *
 * @see https://www.elastic.co/guide/en/kibana/7.17/role-management-specific-api-get.html
 */
const getRole = (name) => {
  if (!name) {
    throw new Error('Missing required parameter: name');
  }

  return axiosClient.get(`/api/security/role/${name}`, { validateStatus: allowNotFound });
};

/**
 * Get all roles
 *
 * @returns {Promise<AxiosResponse<KibanaRole[]>>} The roles
 *
 * @see https://www.elastic.co/guide/en/kibana/7.17/role-management-api-get.html
 */
const getRoles = () => axiosClient.get('/api/security/role');

/**
 * Get kibana saved object
 *
 * @param {Object} options
 * @param {string} options.type
 * @param {string} options.id
 * @param {string} options.spaceId
 *
 * @returns {Promise<AxiosResponse<KibanaObject | KibanaError>>} The saved object or the error
 *
 * @see https://www.elastic.o/guide/en/kibana/7.17/saved-objects-api-get.htmlc
 */
const getObject = (options) => {
  const {
    type,
    id,
    spaceId,
  } = options || {};

  const spacePrefix = spaceId ? `/s/${spaceId}` : '';
  return axiosClient.get(`${spacePrefix}/api/saved_objects/${type}/${id}`, { validateStatus: allowNotFound });
};

/**
 * Find kibana saved objects
 *
 * @param {Object} options
 * @param {string} options.type
 * @param {string} options.spaceId
 * @param {number} [options.page]
 * @param {number} [options.perPage]
 *
 * @returns {Promise<AxiosResponse<KibanaFoundObjects>>} The saved object
 *
 * @see https://www.elastic.co/guide/en/kibana/7.17/saved-objects-api-find.html
 */
const findObjects = (options) => {
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

/**
 * Create a kibana index pattern
 *
 * @param {string} spaceId
 * @param {Object} opts
 * @param {string} opts.title
 * @param {string} opts.timeFieldName
 *
 * @returns {Promise<AxiosResponse<KibanaObject>>} The saved object
 *
 * @see https://www.elastic.co/guide/en/kibana/7.17/saved-objects-api-create.html
 */
const createIndexPattern = (spaceId, opts) => {
  const attributes = opts || {};

  if (!attributes.title) {
    throw new Error('Missing required parameter: title');
  }
  if (!attributes.timeFieldName) {
    throw new Error('Missing required parameter: timeFieldName');
  }

  const spacePrefix = spaceId ? `/s/${spaceId}` : '';
  return axiosClient.post(`${spacePrefix}/api/saved_objects/index-pattern`, { attributes });
};

/**
 * Get all index patterns of a space
 *
 * @param {Object} opts
 * @param {string} opts.spaceId
 * @param {number} [opts.page]
 * @param {number} [opts.perPage]
 *
 * @returns The index patters
 */
const getIndexPatterns = async (opts) => {
  const options = {
    ...(opts || {}),
    type: 'index-pattern',
  };

  const { data } = await findObjects(options);
  let patterns = data && data.saved_objects;

  if (!Array.isArray(patterns)) {
    patterns = [];
  }

  return patterns.map((obj) => {
    const { id, updated_at: updatedAt, attributes } = obj || {};
    const { title, timeFieldName } = attributes || {};

    return {
      spaceId: options.spaceId || null,
      id,
      updatedAt,
      title,
      timeFieldName,
    };
  });
};

/**
 * Get the default index pattern of a space
 *
 * @param {string} spaceId - ID of the space
 *
 * @returns {Promise<string | null>} ID of the default index pattern
 */
const getDefaultIndexPattern = async (spaceId) => {
  const spacePrefix = spaceId ? `/s/${spaceId}` : '';

  const { data } = await axiosClient.get(`${spacePrefix}/api/index_patterns/default`);

  return typeof data?.index_pattern_id === 'string' ? data.index_pattern_id : null;
};

/**
 * Set the default index pattern of a space
 *
 * @param {string} spaceId - ID of the space
 * @param {string | null} patternId - ID of the index pattern to set as default
 *
 * @returns {Promise<string | null>} ID of the default index pattern
 */
const setDefaultIndexPattern = async (spaceId, patternId, opts) => {
  const spacePrefix = spaceId ? `/s/${spaceId}` : '';

  return axiosClient.post(`${spacePrefix}/api/index_patterns/default`, {
    index_pattern_id: patternId,
    force: opts?.force !== false,
  });
};

/**
 * Export a kibana dashboard
 *
 * @param {Object} opts
 * @param {string|string[]} opts.dashboardId
 * @param {string} opts.spaceId
 *
 * @returns {Promise<AxiosResponse<{ objects: Object[] }>>} The saved objects
 *
 * @see https://www.elastic.co/guide/en/kibana/7.17/dashboard-api-export.html
 */
const exportDashboard = (opts) => {
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

/**
 * Import a kibana dashboard
 *
 * @param {Object} opts
 * @param {{ objects: Object[] }} opts.data
 * @param {string} opts.spaceId
 * @param {boolean} [opts.force]
 *
 * @returns {Promise<AxiosResponse<{ objects: Object[] }>>} The saved objects
 *
 * @see https://www.elastic.co/guide/en/kibana/7.17/dashboard-import-api.html
 */
const importDashboard = (opts) => {
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

module.exports = {
  DEFAULT_SPACE,
  getSpaces,
  getSpace,
  createSpace,
  updateSpace,
  updateSpaceSettings,
  deleteSpace,
  putRole,
  deleteRole,
  getRole,
  getRoles,
  createIndexPattern,
  getDefaultIndexPattern,
  setDefaultIndexPattern,
  getIndexPatterns,
  findObjects,
  getObject,
  exportDashboard,
  importDashboard,
};

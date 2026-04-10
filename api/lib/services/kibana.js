// @ts-check
const { ofetch, createFetchError } = require('ofetch');
const config = require('config');

const username = config.get('elasticsearch.user');
const password = config.get('elasticsearch.password');
const host = config.get('kibana.host');
const port = config.get('kibana.port');

const authString = Buffer.from(`${username}:${password}`).toString('base64');

const DEFAULT_SPACE = 'default';

/* eslint-disable max-len */
/**
 * @typedef {{ statusCode: number, error: string, message: string }} KibanaError
 *
 * @typedef {{ spaces?: string[], base?: string[], feature?: Record<string, unknown> }} KibanaPrivileges
 * @typedef {{ name: string, elasticsearch?: Record<string, unknown>, kibana: KibanaPrivileges[] }} KibanaRole
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
 * @typedef {{ id: string, type: string, attributes: Record<string, unknown>, updated_at?: string }} KibanaObject
 * @typedef {{ saved_objects: KibanaObject[], total: number, page: number }} KibanaFoundObjects
 */
/* eslint-enable max-len */

const headers = new Headers({
  Authorization: `Basic ${authString}`,
  // Kibana won't accept any request without this
  'kbn-xsrf': 'true',
});

const $fetch = ofetch.create({
  baseURL: `http://${host}:${port}`,
  headers,
});

/**
 * Get all spaces
 *
 * @returns {Promise<KibanaSpace[]>}
 *
 * @see https://www.elastic.co/guide/en/kibana/7.17/spaces-api-get-all.html
 */
const getSpaces = () => $fetch('/api/spaces/space');

/**
 * Get a kibana space using given id
 *
 * @param {string} id The id of the space
 *
 * @returns {Promise<KibanaSpace | KibanaError | null>} The space or the error, `null` if not found
 *
 * @see https://www.elastic.co/guide/en/kibana/7.17/spaces-api-get.html
 */
async function getSpace(id) {
  if (!id) {
    throw new Error('Missing required parameter: id');
  }

  const request = `/api/spaces/space/${id}`;
  const response = await $fetch.raw(request, { ignoreResponseError: true });
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw createFetchError({ request, options: { headers }, response });
  }
  const { _data } = response;
  return _data;
}

/**
 * Create a kibana space
 *
 * @param {KibanaSpace} opts The kibana space
 *
 * @returns {Promise<KibanaSpace>} The space
 *
 * @see https://www.elastic.co/guide/en/kibana/7.17/spaces-api-post.html
 */
async function createSpace(opts) {
  const options = opts || {};

  if (!options.id) {
    throw new Error('Missing required parameter: id');
  }
  if (!options.name) {
    throw new Error('Missing required parameter: name');
  }

  return $fetch('/api/spaces/space', {
    method: 'POST',
    body: options,
  });
}

/**
 * Updates a kibana space
 *
 * @param {KibanaSpace} opts The kibana space
 *
 * @returns {Promise<KibanaSpace>} The space
 *
 * @see https://www.elastic.co/guide/en/kibana/7.17/spaces-api-put.html
 */
async function updateSpace(opts) {
  const options = opts || {};

  if (!options.id) {
    throw new Error('Missing required parameter: id');
  }
  if (!options.name) {
    throw new Error('Missing required parameter: name');
  }

  return $fetch(`/api/spaces/space/${options.id}`, {
    method: 'PUT',
    body: options,
  });
}

/**
 * Updates kibana settings
 *
 * @param {Record<string, any> & { id: string }} opts The kibana settings
 *
 * @returns {Promise<void>} The space
 *
 * @see https://www.elastic.co/guide/en/kibana/7.17/advanced-options.html
 */
async function updateSpaceSettings(opts) {
  const { id, changes } = opts || {};

  if (!id) {
    throw new Error('Missing required parameter: id');
  }

  await $fetch(`/s/${id}/api/kibana/settings`, {
    method: 'POST',
    body: { changes },
  });
}

/**
 * Delete a kibana space
 *
 * @param {string} spaceId The id of the space
 *
 * @returns {Promise<void>}
 *
 * @see https://www.elastic.co/guide/en/kibana/7.17/spaces-api-delete.html
 */
async function deleteSpace(spaceId) {
  if (!spaceId) {
    throw new Error('Missing required parameter: spaceId');
  }

  await $fetch(`/api/spaces/space/${spaceId}`, {
    method: 'DELETE',
  });
}

/**
 * Create or update role using given name
 *
 * @param {string} name - Name of role.
 * @param {Map<string, { features: Record<string, string[]> }>} spaces - Map of rights,
 * key is the index value and value are the rights.
 * @param {Map<string, { privileges: string[] }>} [indices] - Map of rights,
 * key is the index value and value are the rights.
 *
 * @returns {Promise<object>}
 *
 * @see https://www.elastic.co/guide/en/kibana/7.17/role-management-api-put.html
 */
const putRole = (name, spaces, indices) => $fetch(`/api/security/role/${name}`, {
  method: 'PUT',
  body: {
    elasticsearch: {
      cluster: [],
      indices: [...(indices ?? [])].map(([index, { privileges }]) => ({
        names: [index],
        privileges,
      })),
    },
    kibana: [...spaces].map(([id, { features }]) => ({
      spaces: [id],
      feature: features,
    })),
  },
});

/**
 * Delete role using given name
 *
 * @param {string} name The name of the role
 *
 * @returns {Promise<object>}
 *
 * @see https://www.elastic.co/guide/en/kibana/7.17/role-management-api-delete.html
 */
async function deleteRole(name) {
  if (!name) {
    throw new Error('Missing required parameter: name');
  }

  return $fetch(`/api/security/role/${name}`, { method: 'DELETE' });
}

/**
 * Get role using given name
 *
 * @param {string} name The name of the role
 *
 * @returns {Promise<KibanaRole | KibanaError | null>} The role or the error, `null` if not found
 *
 * @see https://www.elastic.co/guide/en/kibana/7.17/role-management-specific-api-get.html
 */
async function getRole(name) {
  if (!name) {
    throw new Error('Missing required parameter: name');
  }

  const request = `/api/security/role/${name}`;
  const response = await $fetch.raw(request, { ignoreResponseError: true });
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw createFetchError({ request, options: { headers }, response });
  }
  const { _data } = response;
  return _data;
}

/**
 * Get all roles
 *
 * @returns {Promise<KibanaRole[]>} The roles
 *
 * @see https://www.elastic.co/guide/en/kibana/7.17/role-management-api-get.html
 */
const getRoles = () => $fetch('/api/security/role');

/**
 * Get kibana saved object
 *
 * @param {Object} options
 * @param {string} options.type
 * @param {string} options.id
 * @param {string} options.spaceId
 *
 * @returns {Promise<KibanaObject | KibanaError | null>} The saved object or the error, or not found
 *
 * @see https://www.elastic.o/guide/en/kibana/7.17/saved-objects-api-get.htmlc
 */
async function getObject(options) {
  const {
    type,
    id,
    spaceId,
  } = options || {};

  const spacePrefix = spaceId ? `/s/${spaceId}` : '';

  const request = `${spacePrefix}/api/saved_objects/${type}/${id}`;
  const response = await $fetch.raw(request, { ignoreResponseError: true });
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw createFetchError({ request, options: { headers }, response });
  }
  const { _data } = response;
  return _data;
}

/**
 * Find kibana saved objects
 *
 * @param {Object} options
 * @param {string} options.type
 * @param {string} options.spaceId
 * @param {number} [options.page]
 * @param {number} [options.perPage]
 *
 * @returns {Promise<KibanaFoundObjects>} The saved object
 *
 * @see https://www.elastic.co/guide/en/kibana/7.17/saved-objects-api-find.html
 */
async function findObjects(options) {
  const {
    type,
    spaceId,
    page,
    perPage,
  } = options || {};

  const spacePrefix = spaceId ? `/s/${spaceId}` : '';

  return $fetch(`${spacePrefix}/api/saved_objects/_find`, {
    params: {
      type,
      page: page || 1,
      per_page: perPage || 50,
    },
  });
}

/**
 * Create a kibana index pattern
 *
 * @param {string} spaceId
 * @param {Object} opts
 * @param {string} opts.title
 * @param {string} opts.timeFieldName
 *
 * @returns {Promise<KibanaObject>} The saved object
 *
 * @see https://www.elastic.co/guide/en/kibana/7.17/saved-objects-api-create.html
 */
async function createIndexPattern(spaceId, opts) {
  const attributes = opts || {};

  if (!attributes.title) {
    throw new Error('Missing required parameter: title');
  }
  if (!attributes.timeFieldName) {
    throw new Error('Missing required parameter: timeFieldName');
  }

  const spacePrefix = spaceId ? `/s/${spaceId}` : '';
  return $fetch(`${spacePrefix}/api/saved_objects/index-pattern`, {
    method: 'POST',
    body: { attributes },
  });
}

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
async function getIndexPatterns(opts) {
  const options = {
    ...opts,
    type: 'index-pattern',
  };

  const data = await findObjects(options);

  let patterns = data?.saved_objects;
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
}

/**
 * Get the default index pattern of a space
 *
 * @param {string} spaceId - ID of the space
 *
 * @returns {Promise<string | null>} ID of the default index pattern
 */
async function getDefaultIndexPattern(spaceId) {
  const spacePrefix = spaceId ? `/s/${spaceId}` : '';

  const data = await $fetch(`${spacePrefix}/api/index_patterns/default`);

  return typeof data?.index_pattern_id === 'string' ? data.index_pattern_id : null;
}

/**
 * Set the default index pattern of a space
 *
 * @param {string} spaceId - ID of the space
 * @param {string | null} patternId - ID of the index pattern to set as default
 * @param {object} [opts]
 * @param {boolean} [opts.force]
 *
 * @returns {Promise<void>}
 */
async function setDefaultIndexPattern(spaceId, patternId, opts) {
  const spacePrefix = spaceId ? `/s/${spaceId}` : '';

  await $fetch(`${spacePrefix}/api/index_patterns/default`, {
    method: 'POST',
    body: {
      index_pattern_id: patternId,
      force: opts?.force !== false,
    },
  });
}

/**
 * Export a kibana dashboard
 *
 * @param {Object} opts
 * @param {string|string[]} opts.dashboardId
 * @param {string} opts.spaceId
 *
 * @returns {Promise<{ objects: Object[] }>} The saved objects
 *
 * @see https://www.elastic.co/guide/en/kibana/7.17/dashboard-api-export.html
 */
async function exportDashboard(opts) {
  const {
    dashboardId, // Can be an array
    spaceId,
  } = opts || {};

  const spacePrefix = spaceId ? `/s/${spaceId}` : '';

  return $fetch(`${spacePrefix}/api/kibana/dashboards/export`, {
    params: {
      dashboard: dashboardId,
    },
  });
}

/**
 * Import a kibana dashboard
 *
 * @param {Object} opts
 * @param {{ objects: Object[] }} opts.data
 * @param {string} opts.spaceId
 * @param {boolean} [opts.force]
 *
 * @returns {Promise<{ objects: Object[] }>} The saved objects
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

  return $fetch(`${spacePrefix}/api/kibana/dashboards/import`, {
    method: 'POST',
    params: {
      force: !!force,
    },
    body: data,
  });
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

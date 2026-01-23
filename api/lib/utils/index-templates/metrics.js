module.exports = {
  settings: {
    number_of_shards: 1,
  },
  mappings: {
    _meta: {
      // Change this whenever you update the mapping,
      // it'll trigger a migration when ezMESURE start
      version: 1,
    },
    dynamic_templates: [
      {
        strings_as_keywords: {
          match_mapping_type: 'string',
          mapping: {
            type: 'keyword',
          },
        },
      },
    ],
    properties: {
      datetime: {
        type: 'date',
        format: 'epoch_millis',
      },
      responseTime: { type: 'integer' },
      action: { type: 'keyword' },
      index: { type: 'keyword' },
      user: {
        properties: {
          name: { type: 'keyword' },
          roles: { type: 'keyword' },
          idp: { type: 'keyword' },
        },
      },
      request: {
        properties: {
          method: { type: 'keyword' },
          url: { type: 'keyword' },
          remoteIP: { type: 'keyword' },
          userAgent: { type: 'keyword' },
          query: {
            properties: {
              nostore: { type: 'keyword' },
            },
          },
        },
      },
      response: {
        properties: {
          status: { type: 'integer' },
          body: {
            dynamic: false,
            // Add properties that needs to be indexed
            properties: {
              error: { type: 'keyword' },
              errors: { type: 'keyword' },
              total: { type: 'integer' },
              inserted: { type: 'integer' },
              updated: { type: 'integer' },
              failed: { type: 'integer' },
              acknowledged: { type: 'boolean' },
            },
          },
        },
      },
      metadata: {
        dynamic: false,
        // Add properties that needs to be indexed
        properties: {
          broadcasted: {
            type: 'date',
          },
        },
      },
    },
  },
};

module.exports = {
  settings: {
    number_of_shards: 1,
  },
  mappings: {
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
      type: { type: 'keyword' },

      // Institution
      institution: {
        properties: {
          createdAt: { type: 'date' },
          updatedAt: { type: 'date' },
          name: { type: 'keyword' },
          acronym: { type: 'keyword' },
          uai: { type: 'keyword' },
          city: { type: 'keyword' },
          website: { type: 'keyword' },
          logoId: { type: 'keyword' },
          type: { type: 'keyword' },
          location: { type: 'geo_point' },
          domains: { type: 'keyword' },
          creator: { type: 'keyword' },
          indexPrefix: { type: 'keyword' },
          indexCount: { type: 'long' },
          auto: {
            properties: {
              ezmesure: { type: 'boolean' },
              ezpaarse: { type: 'boolean' },
              report: { type: 'boolean' },
            },
          },
        },
      },

      // Sushi items
      sushi: {
        properties: {
          createdAt: { type: 'date' },
          updatedAt: { type: 'date' },
          institutionId: { type: 'keyword' },
          vendor: { type: 'keyword' },
          package: { type: 'keyword' },
          sushiUrl: { type: 'keyword' },
          requestorId: { type: 'keyword' },
          consortialId: { type: 'keyword' },
          customerId: { type: 'keyword' },
          apiKey: { type: 'keyword' },
          comment: { type: 'keyword' },
          connectionState: {
            properties: {
              date: { type: 'date' },
              success: { type: 'boolean' },
            },
          },
          params: {
            properties: {
              name: { type: 'keyword' },
              value: { type: 'keyword' },
            },
          },
        },
      },

      // Task items
      task: {
        properties: {
          createdAt: { type: 'date' },
          updatedAt: { type: 'date' },
          sushiId: { type: 'keyword' },
          institutionId: { type: 'keyword' },
          status: { type: 'keyword' },
          runningTime: { type: 'long' },
          logs: {
            properties: {
              date: { type: 'date' },
              type: { type: 'keyword' },
              message: { type: 'keyword' },
            },
          },
          result: {
            type: 'object',
          },
        },
      },
    },
  },
};

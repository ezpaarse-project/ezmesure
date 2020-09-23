module.exports = {
  settings: {
    number_of_shards: 1,
  },
  mappings: {
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
          indexPrefix: { type: 'keyword' },
          indexCount: { type: 'long' },
          auto: {
            properties: {
              ezmesure: { type: 'boolean' },
              ezpaarse: { type: 'boolean' },
              report: { type: 'boolean' },
            },
          },
          members: {
            type: 'nested',
            properties: {
              username: { type: 'keyword' },
              type: { type: 'keyword' },
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
        },
      },
    },
  },
};

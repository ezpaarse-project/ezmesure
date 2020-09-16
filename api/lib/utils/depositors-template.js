module.exports = {
  settings: {
    number_of_shards: 1,
  },
  mappings: {
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
};

module.exports = {
  settings: {
    number_of_shards: 1,
  },
  mappings: {
    properties: {
      name: { type: 'keyword' },
      acronym: { type: 'keyword' },
      uai: { type: 'keyword' },
      city: { type: 'keyword' },
      website: { type: 'keyword' },
      logoId: { type: 'keyword' },
      type: { type: 'keyword' },
      location: { type: 'geo_point' },
      domains: { type: 'keyword' },
      auto: {
        properties: {
          ezmesure: { type: 'boolean' },
          ezpaarse: { type: 'boolean' },
          report: { type: 'boolean' },
        },
      },
      sushi: { type: 'nested' },
      members: {
        type: 'nested',
        properties: {
          username: { type: 'keyword' },
          type: { type: 'keyword' },
        },
      },
      index: {
        properties: {
          count: { type: 'long' },
          prefix: { type: 'keyword' },
        },
      },
      createdAt: { type: 'date' },
      updatedAt: { type: 'date' },
    },
  },
};

module.exports = {
  settings: {
    number_of_shards: 1,
  },
  mappings: {
    properties: {
      organisation: {
        properties: {
          name: { type: 'keyword' },
          nomCourt: { type: 'keyword' },
          uai: { type: 'keyword' },
          city: { type: 'keyword' },
          website: { type: 'keyword' },
          logoUrl: { type: 'keyword' },
        },
      },
      auto: {
        properties: {
          ezmesure: { type: 'boolean' },
          ezpaarse: { type: 'boolean' },
          report: { type: 'boolean' },
        },
      },
      contact: {
        properties: {
          confirmed: { type: 'boolean' },
          users: { type: 'nested' },
        },
      },
      index: {
        properties: {
          count: { type: 'long' },
          prefix: { type: 'keyword' },
        },
      },
      location: {
        type: 'geo_point',
      },
    },
  },
};

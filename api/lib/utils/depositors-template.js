module.exports = {
  settings: {
    number_of_shards: 1,
  },
  mappings: {
    properties: {
      organisation: {
        properties: {
          name: { type: 'keyword' },
          shortName: { type: 'keyword' },
          uai: { type: 'keyword' },
          city: { type: 'keyword' },
          website: { type: 'keyword' },
          logoUrl: { type: 'keyword' },
          establismentType: { type: 'keyword' },
          location: {
            type: 'geo_point',
          },
          domains: { type: 'keyword' },
        },
      },
      auto: {
        properties: {
          ezmesure: { type: 'boolean' },
          ezpaarse: { type: 'boolean' },
          report: { type: 'boolean' },
        },
      },
      sushi: { type: 'nested' },
      contacts: {
        type: 'nested',
        properties: {
          fullName: { type: 'keyword' },
          email: { type: 'keyword' },
          type: { type: 'keyword' },
          confirmed: { type: 'boolean' },
        },
      },
      index: {
        properties: {
          count: { type: 'long' },
          prefix: { type: 'keyword' },
          suggested: { type: 'keyword' },
        },
      },
      createdAt: { type: 'date' },
      updatedAt: { type: 'date' },
    },
  },
};

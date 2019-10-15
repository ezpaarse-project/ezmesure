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
      dashboardId: {
        type: 'text',
      },
      space: {
        type: 'text',
      },
      emails: {
        type: 'text',
      },
      frequency: {
        type: 'text',
      },
      dashboardId: {
        type: 'text',
      },
      print: {
        type: 'boolean',
      },
      image: {
        type: 'boolean',
      },
      createdAt: {
        type: 'date',
      },
      updatedAt: {
        type: 'date',
      },
      sentAt: {
        type: 'date',
      },
    },
  },
};

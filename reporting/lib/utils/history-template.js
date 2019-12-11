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
      taskId: {
        type: 'text',
      },
      executionTime: {
        type: 'integer',
      },
      data: {
        type: 'nested',
      },
      createdAt: {
        type: 'date',
      },
    },
  },
};

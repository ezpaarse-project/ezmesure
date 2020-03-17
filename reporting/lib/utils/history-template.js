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
        type: 'keyword',
      },
      executionTime: {
        type: 'integer',
      },
      status: {
        type: 'keyword',
      },
      logs: {
        type: 'nested',
      },
      startTime: {
        type: 'date',
      },
      endTime: {
        type: 'date',
      },
    },
  },
};

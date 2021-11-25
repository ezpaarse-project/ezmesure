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
      doi: { type: 'keyword' },
      print_identifier: { type: 'keyword' },
      report_type: { type: 'keyword' },
      package: { type: 'keyword' },
      online_identifier: { type: 'keyword' },
      publication_date: { type: 'keyword' },
      year_of_publication: { type: 'keyword' },
      publication_title: { type: 'keyword' },
      platform: { type: 'keyword' },
      publisher: { type: 'keyword' },
      data_type: { type: 'keyword' },
      section_type: { type: 'keyword' },
      access_type: { type: 'keyword' },
      access_method: { type: 'keyword' },
      totalItemInvestigations: { type: 'integer' },
      uniqueItemInvestigations: { type: 'integer' },
      totalItemRequests: { type: 'integer' },
      uniqueItemRequests: { type: 'integer' },
      uniqueTitleInvestigations: { type: 'integer' },
      uniqueTitleRequests: { type: 'integer' },
      date: { type: 'date', format: 'yyyy-MM' },
    },
  },
};

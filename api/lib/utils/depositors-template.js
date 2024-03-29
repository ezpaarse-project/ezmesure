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
          techContactName: { type: 'keyword' },
          docContactName: { type: 'keyword' },
          indexPrefix: { type: 'keyword' },
          indexCount: { type: 'long' },
          sushiReadySince: { type: 'date' },
          auto: {
            properties: {
              ezmesure: { type: 'boolean' },
              ezpaarse: { type: 'boolean' },
              report: { type: 'boolean' },
              sushi: { type: 'boolean' },
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
          customerId: { type: 'keyword' },
          apiKey: { type: 'keyword' },
          comment: { type: 'keyword' },
          importState: {
            properties: {
              date: { type: 'date' },
              success: { type: 'boolean' },
              steps: {
                properties: {
                  label: { type: 'keyword' },
                  status: { type: 'keyword' },
                },
              },
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

      // Sushi items
      'sushi-endpoint': {
        properties: {
          createdAt: { type: 'date' },
          updatedAt: { type: 'date' },
          institutionId: { type: 'keyword' },
          vendor: { type: 'keyword' },
          sushiUrl: { type: 'keyword' },
          description: { type: 'keyword' },
          technicalProvider: { type: 'keyword' },
          paramSeparator: { type: 'keyword' },
          validated: { type: 'boolean' },
          requireCustomerId: { type: 'boolean' },
          requireRequestorId: { type: 'boolean' },
          requireApiKey: { type: 'boolean' },
          isSushiCompliant: { type: 'boolean' },
          tags: { type: 'keyword' },
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
          type: { type: 'keyword' },
          status: { type: 'keyword' },
          runningTime: { type: 'long' },
          params: {
            properties: {
              sushiId: { type: 'keyword' },
              beginDate: { type: 'keyword' },
              endDate: { type: 'keyword' },
            },
          },
          logs: {
            properties: {
              date: { type: 'date' },
              type: { type: 'keyword' },
              message: { type: 'keyword' },
            },
          },
          steps: {
            properties: {
              label: { type: 'keyword' },
              status: { type: 'keyword' },
              startTime: { type: 'date' },
              took: { type: 'long' },
              data: {
                properties: {
                  url: { type: 'keyword' },
                  params: { properties: {} },
                  processedReportItems: { type: 'long' },
                  progress: { type: 'long' },
                  reportId: { type: 'keyword' },
                  reportIsValid: { type: 'boolean' },
                  reportValidationIgnored: { type: 'boolean' },
                  statusCode: { type: 'long' },
                  sushiErrorCode: { type: 'long' },
                  sushiExceptionCode: { type: 'long' },
                  totalReportItems: { type: 'long' },
                },
              },
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

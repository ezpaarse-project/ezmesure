const itemId = {
  properties: {
    Online_ISSN: { type: 'keyword' },
    Print_ISSN: { type: 'keyword' },
    Linking_ISSN: { type: 'keyword' },
    ISBN: { type: 'keyword' },
    DOI: { type: 'keyword' },
    Proprietary: { type: 'keyword' },
    URI: { type: 'keyword' },
  },
};

const itemDates = {
  properties: {
    Publication_Date: { type: 'keyword' },
  },
};

const itemAttributes = {
  properties: {
    Article_Version: { type: 'keyword' },
    Article_Type: { type: 'keyword' },
    Qualification_Name: { type: 'keyword' },
    Qualification_Level: { type: 'keyword' },
    Proprietary: { type: 'keyword' },
  },
};

const itemContributors = {
  properties: {
    Type: { type: 'keyword' },
    Name: { type: 'keyword' },
    Identifier: { type: 'keyword' },
  },
};

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
      Report_Type: { type: 'keyword' },
      Package: { type: 'keyword' },
      Date: { type: 'date', format: 'yyyy-MM' },

      Metric_Type: { type: 'keyword' },
      Count: { type: 'integer' },

      Title: { type: 'keyword' },
      Item: { type: 'keyword' },
      Database: { type: 'keyword' },
      Platform: { type: 'keyword' },
      Publisher: { type: 'keyword' },
      Data_Type: { type: 'keyword' },
      YOP: { type: 'keyword' },
      Section_Type: { type: 'keyword' },
      Access_Type: { type: 'keyword' },
      Access_Method: { type: 'keyword' },

      Item_ID: itemId,
      Item_Dates: itemDates,
      Item_Attributes: itemAttributes,
      Item_Contributors: itemContributors,

      Publisher_ID: {
        properties: {
          ISNI: { type: 'keyword' },
          Proprietary: { type: 'keyword' },
        },
      },

      Period: {
        properties: {
          Begin_Date: { type: 'date', format: 'yyyy-MM-dd' },
          End_Date: { type: 'date', format: 'yyyy-MM-dd' },
        },
      },

      Item_Parent: {
        properties: {
          Item_Name: { type: 'keyword' },
          Data_Type: { type: 'keyword' },
          Item_ID: itemId,
          Item_Dates: itemDates,
          Item_Attributes: itemAttributes,
          Item_Contributors: itemContributors,
        },
      },

      Report_Header: {
        properties: {
          Created: { type: 'date' },
          Created_By: { type: 'keyword' },
          Customer_ID: { type: 'keyword' },
          Report_ID: { type: 'keyword' },
          Release: { type: 'keyword' },
          Report_Name: { type: 'keyword' },
          Institution_Name: { type: 'keyword' },

          Institution_ID: {
            properties: {
              ISNI: { type: 'keyword' },
              ISIL: { type: 'keyword' },
              OCLC: { type: 'keyword' },
              Proprietary: { type: 'keyword' },
            },
          },

          Report_Filters: {
            properties: {
              Begin_Date: { type: 'keyword' },
            },
          },
          Report_Attributes: {
            properties: {
              Attributes_To_Show: { type: 'keyword' },
            },
          },
        },
      },
    },
  },
};

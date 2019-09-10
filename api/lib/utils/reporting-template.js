module.exports = {
  "settings" : {
    "number_of_shards" : 1
  },
  "mappings": {
    "dynamic_templates": [
      {
        "strings_as_keywords": {
          "match_mapping_type": "string",
          "mapping": {
            "type": "keyword"
          }
        }
      }
    ],
    "properties": {
      "dashboardId": {
        "type": "text"
      },
      "space": {
        "type": "text"
      },
      "emails": {
        "type": "text"
      },
      "timeSpan": {
        "type": "text"
      },
      "dashboardId": {
        "type": "text"
      },
      "user": {
        "type": "text"
      },
      "createdAt": {
        "type": "date",
        "format": "epoch_millis"
      },
      "updatedAt": {
        "type": "date",
        "format": "epoch_millis"
      }
    }
  }
}

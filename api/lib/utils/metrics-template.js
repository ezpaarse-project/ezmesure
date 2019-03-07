module.exports = {
  "settings" : {
    "number_of_shards" : 1
  },
  "mappings": {
    "_doc": {
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
        "datetime": {
          "type": "date",
          "format": "epoch_millis"
        },
        "responseTime": { "type": "integer" },
        "action": { "type": "keyword" },
        "index": { "type": "keyword" },
        "user":{
          "properties": {
            "name":  { "type": "keyword" },
            "roles": { "type": "keyword" },
            "idp":   { "type": "keyword" }
          },
        },
        "request": {
          "properties": {
            "method":    { "type": "keyword" },
            "url":       { "type": "keyword" },
            "remoteIP":  { "type": "keyword" },
            "userAgent": { "type": "keyword" },
            "query": {
              "properties": {
                "nostore": { "type": "keyword" }
              }
            }
          }
        },
        "response": {
          "properties": {
            "status": { "type": "integer" },
            "body": {
              "properties": {
                "error":        { "type": "keyword" },
                "errors":       { "type": "keyword" },
                "total":        { "type": "integer" },
                "inserted":     { "type": "integer" },
                "updated":      { "type": "integer" },
                "failed":       { "type": "integer" },
                "acknowledged": { "type": "boolean" }
              }
            }
          }
        },
        "metadata": {
          "properties": {
            "username": { "type": "keyword" },
            "path": { "type": "keyword" }
          }
        },
      }
    }
  }
}

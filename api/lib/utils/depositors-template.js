module.exports = {
  "settings" : {
    "number_of_shards" : 1
  },
  "mappings": {
    "properties": {
      "organisation": {
        "properties": {
          "name": { "type": "keyword" },
          "label": { "type": "keyword" },
          "uai": { "type": "keyword" },
          "city": { "type": "keyword" },
          "website": { "type": "keyword" },
          "logoUrl": { "type": "keyword" }
        }
      },
      "auto": {
        "properties": {
          "ezmesure": { "type": "boolean" },
          "ezpaarse": { "type": "boolean" },
          "report": { "type": "boolean" }
        }
      },
      "contact": {
        "properties": {
          "confirmed": { "type": "boolean" },
          "doc": {
            "properties": {
              "firstName": { "type": "keyword" },
              "lastName": { "type": "keyword" },
              "mail": { "type": "keyword" }
            }
          },
          "tech": {
            "properties": {
              "firstName": { "type": "keyword" },
              "lastName": { "type": "keyword" },
              "mail": { "type": "keyword" }
            }
          }
        }
      },
      "index": {
        "properties": {
          "count": { "type": "long" },
          "prefix": { "type": "keyword" }
        }
      },
      "location": {
        "type": "geo_point"
      }
    }
  }
}

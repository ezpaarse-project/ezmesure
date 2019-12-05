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
      "date": {
        "type": "date",
        "format": "dd/MM/yyyy||yyyy-MM-dd"
      },
      "datetime": {
        "type": "date"
      },
      "timestamp": {
        "type": "date",
        "format": "epoch_millis"
      },
      "els-publication-date": {
        "type": "date"
      },
      "els-publication-date-year": {
        "type": "date",
        "format": "year"
      },
      "doi-publication-date": {
        "type": "date"
      },
      "doi-publication-date-year": {
        "type": "date",
        "format": "year"
      },
      "size": {
        "type": "integer"
      },
      "status": {
        "type": "integer"
      },
      "geoip-latitude": {
        "type": "float"
      },
      "geoip-longitude": {
        "type": "float"
      },
      "location": {
        "type": "geo_point"
      },
      "index_name": {
        "type": "keyword"
      },
      "log_id": {
        "type": "keyword"
      },
      "domain": {
        "type": "keyword"
      },
      "subject": {
        "type": "keyword"
      },
      "print_identifier": {
        "type": "keyword"
      },
      "online_identifier": {
        "type": "keyword"
      },
      "doi": {
        "type": "keyword"
      },
      "publication_title": {
        "type": "keyword"
      },
      "publication_date": {
        "type": "keyword"
      },
      "login": {
        "type": "keyword"
      },
      "rtype": {
        "type": "keyword"
      },
      "mime": {
        "type": "keyword"
      },
      "on_campus": {
        "type": "keyword"
      },
      "platform": {
        "type": "keyword"
      },
      "platform_name": {
        "type": "keyword"
      },
      "publisher_name": {
        "type": "keyword"
      },
      "title_id": {
        "type": "keyword"
      },
      "unitid": {
        "type": "keyword"
      },
      "url": {
        "type": "keyword"
      }
    }
  }
}

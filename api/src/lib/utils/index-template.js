export default {
  "template": "*",
  "mappings": {
    "event": {
      "dynamic_templates": [
        {
          "strings": {
            "match": "*",
            "match_mapping_type": "string",
            "mapping": {
              "type": "string",
              "index": "not_analyzed"
            }
          }
        }
      ],
      "properties": {
        "date": {
          "type": "date",
	        "format": "dd/MM/YYYY||dd-MM-YYYY"
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
          "type": "string",
          "index": "not_analyzed"
        }
      }
    }
  }
}

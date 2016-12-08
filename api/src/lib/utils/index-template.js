export default {
  "template": "*",
  "mappings": {
    "event": {
      "properties": {
        "date": {
          "type": "date",
	        "format": "dd/MM/YYYY||YYYY-MM-dd"
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
        }
      }
    }
  }
}

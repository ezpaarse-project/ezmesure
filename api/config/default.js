const path = require('path');

module.exports = {
  "port": 3000,
  "mongo": {
    "port": 27017,
    "host": "localhost",
    "db": "ezmesure"
  },
  "elasticsearch": {
    "port": 9200,
    "host": "localhost",
    "indicePrefix": "ez_",
    "user": "elastic",
    "password": "changeme",
    "apiVersion": "5.4"
  },
  "smtp": {
    "host": "localhost",
    "port": 25
  },
  "logs": {
    "app": { "Console": { "timestamp": true, "colorize": true } },
    "http": { "Console": { "timestamp": true, "colorize": true } }
  },
  "auth": {
    "secret": "some-secret",
    "cookie": "eztoken"
  },
  "storage": {
    "path": path.resolve(__dirname, '../storage')
  },
  "notifications": {
    "cron": "0 0 0 * * *"
  }
};

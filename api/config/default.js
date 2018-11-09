const path = require('path');
const { format } = require('winston');

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
    "user": "elastic",
    "password": "changeme",
    "apiVersion": "6.0"
  },
  "smtp": {
    "host": "localhost",
    "port": 25
  },
  "logs": {
    "app": { "Console": { "format": format.combine(
        format.colorize(),
        format.timestamp(),
        format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
    )}},
    "http": { "Console": { "format": format.combine(
      format.colorize(),
      format.metadata(),
      format.timestamp(),
      format.printf(info => `${info.timestamp} ${info.level}: ${Object.entries(info.metadata).map(entry => entry.join('=')).join(' ')}`)
    )}},
  },
  "auth": {
    "secret": "some-secret",
    "cookie": "eztoken"
  },
  "storage": {
    "path": path.resolve(__dirname, '../storage')
  },
  "notifications": {
    "sender": "ezMESURE",
    "cron": "0 0 0 * * *"
  },
  "depositors": {
    "index": "depositors",
    "spreadsheetId": "1cgK6Tvd2No-rqYzyE6OIIbS7VHZdudQGm5TuiOUc0uU",
    "cron": "0 0 0 * * *"
  }
};

const path = require('path');
const { format } = require('winston');

module.exports = {
  port: 3000,
  mongo: {
    port: 27017,
    host: 'localhost',
    db: 'ezmesure',
  },
  elasticsearch: {
    port: 9200,
    host: 'localhost',
    user: 'elastic',
    password: 'changeme',
  },
  kibana: {
    port: 5601,
    host: 'localhost',
  },
  smtp: {
    host: 'localhost',
    port: 25,
  },
  logs: {
    app: {
      Console: {
        format: format.combine(
          format.colorize(),
          format.timestamp(),
          format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}`),
        ),
      },
    },
    http: {
      Console: {
        format: format.combine(
          format.colorize(),
          format.metadata(),
          format.timestamp(),
          format.printf((info) => `${info.timestamp} ${info.level}: ${Object.entries(info.metadata).map((entry) => entry.join('=')).join(' ')}`),
        ),
      },
    },
  },
  auth: {
    secret: 'some-secret',
    cookie: 'eztoken',
  },
  admin: {
    username: 'ezmesure-admin',
    password: 'changeme',
  },
  storage: {
    path: path.resolve(__dirname, '../storage'),
  },
  notifications: {
    sender: 'ezMESURE',
    cron: '0 0 0 * * *',
    sendEmptyActivity: true,
  },
  depositors: {
    index: 'depositors',
    cron: '0 0 0 * * *',
  },
  opendata: {
    index: 'opendata',
    cron: '0 0 0 * * *',
  },
  reportingActivityIndex: '.ezreporting-activity',
  reportingIndex: '.ezreporting',
  cypher: {
    secret: 'some-secret',
  },
  appName: 'ezMESURE',
  passwordResetValidity: 3
};

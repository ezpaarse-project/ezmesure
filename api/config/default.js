const path = require('path');
const { format } = require('winston');

const oneMinute = 60;

module.exports = {
  port: 3000,
  elasticsearch: {
    scheme: 'https',
    port: 9200,
    host: 'localhost',
    url: '',
    user: 'elastic',
    password: 'changeme',
    syncSchedule: '0 0 0 * * *',
  },
  kibana: {
    username: 'kibana_system',
    password: 'changeme',
    port: 5601,
    host: 'localhost',
    url: '',
    dateFormat: 'DD MMM YYYY',
    syncSchedule: '0 0 0 * * *',
  },
  redis: {
    host: 'localhost',
    port: 6379,
    password: 'changeme',
  },
  smtp: {
    host: 'localhost',
    port: 25,
    secure: false,
    ignoreTLS: false,
  },
  ezreeport: {
    host: 'reporting',
    port: 8080,
    syncSchedule: '0 0 0 * * *',
    apiKey: '00000000-0000-0000-0000-000000000000',
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
    fullName: 'ezMESURE Administrator',
    password: 'changeme',
    email: 'admin@admin.com',
  },
  storage: {
    path: path.resolve(__dirname, '../storage'),
  },
  ezpaarse: {
    upload: {
      bulkSize: 2000,
      bulkMaxTries: 5,
      bulkBaseRetryDelay: 1000,
    },
  },
  jobs: {
    harvest: {
      concurrency: 1,
      maxDeferrals: 5,
      deferralBackoffDuration: 10 * oneMinute,
      busyBackoffDuration: 10 * oneMinute,
      cancelSchedule: '0 0 0 * * *',
    },
  },
  counter: {
    defaultHarvestedReports: [
      'dr',
      'dr_d1',
      'ir',
      'pr',
      'pr_p1',
      'tr',
      'tr_b1',
      'tr_j1',
    ],
    clean: {
      schedule: '0 0 0 * * *',
      maxDayAge: 7,
    },
  },
  notifications: {
    sender: 'ezMESURE',
    cron: '0 0 0 * * *',
    sendEmptyActivity: true,
    recipients: ['exemple@exemple.fr'],
    supportRecipients: ['ezcounter-support@exemple.fr'],
  },
  depositors: {
    index: 'depositors',
    cron: '0 0 0 * * *',
  },
  opendata: {
    index: 'opendata',
    cron: '0 0 0 * * *',
  },
  cypher: {
    secret: 'some-secret',
  },
  appName: 'ezMESURE',
  passwordResetValidity: 3,
};

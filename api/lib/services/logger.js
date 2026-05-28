const config = require('config');
const winston = require('winston');

const BufferedLogTransport = require('../utils/buffered-log-transport');

const winstonTransports = {
  ...winston.transports,
  Buffered: BufferedLogTransport,
};

function logger(loggersConfig) {
  const transports = [];

  Object.entries(loggersConfig).forEach(([key, value]) => {
    if (value) {
      transports.push(new (winstonTransports[key])(value));
    }
  });

  return winston.createLogger({ transports });
}

module.exports = {
  appLogger: logger(config.get('logs.app')),
  httpLogger: logger(config.get('logs.http')),
};

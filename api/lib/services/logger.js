const config = require('config');
const winston = require('winston');

function logger(loggersConfig) {
  const transports = [];

  Object.entries(loggersConfig).forEach(([key, value]) => {
    if (value) {
      transports.push(new (winston.transports[key])(value));
    }
  });

  return winston.createLogger({ transports });
}

module.exports = {
  appLogger: logger(config.get('logs.app')),
  httpLogger: logger(config.get('logs.http')),
};

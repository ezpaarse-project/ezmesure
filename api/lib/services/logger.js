const winston = require('winston');

module.exports = function logger(loggersConfig) {
  const transports = [];

  Object.entries(loggersConfig).forEach(([key, value]) => {
    if (value) {
      transports.push(new (winston.transports[key])(value));
    }
  });

  return winston.createLogger({ transports });
};

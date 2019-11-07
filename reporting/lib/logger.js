const winston = require('winston');

winston.addColors({
  verbose: 'green', info: 'green', warn: 'yellow', error: 'red',
});

const { format } = winston;

module.exports = winston.createLogger({
  level: 'info',
  format: format.combine(
    format.colorize(),
    format.timestamp(),
    format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`),
  ),
  transports: [
    new (winston.transports.Console)(),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
  ],
});

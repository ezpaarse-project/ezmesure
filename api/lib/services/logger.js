// @ts-check

const config = require('config');
const winston = require('winston');

const BufferedLogTransport = require('../utils/buffered-log-transport');

const logsConfig = config.get('logs') ?? {};

const winstonTransports = {
  File: winston.transports.File,
  Console: winston.transports.Console,
  Http: winston.transports.Http,
  Stream: winston.transports.Stream,
  Buffered: BufferedLogTransport,
};

/** @typedef {'app'|'http'} LoggerType */
/** @typedef {keyof winstonTransports} TransportKey */
/**
 * @typedef {{
 *  File?: winston.transports.FileTransportOptions
 *  Console?: winston.transports.ConsoleTransportOptions,
 *  Http?: winston.transports.HttpTransportOptions,
 *  Stream?: winston.transports.StreamTransportOptions,
 *  Buffered?: BufferedLogTransport,
 * }} TransportsConfig
 */

/**
 * Create a logger instance
 * @param {TransportsConfig} transportsConfig - The logger config
 * @returns {winston.Logger}
 */
function createLogger(transportsConfig) {
  /** @type {winston.transport[]} */
  const transports = [];

  Object.entries(transportsConfig).forEach(
    ([key, value]) => {
      if (value) {
        transports.push(new (winstonTransports[key])(value));
      }
    },
  );

  return winston.createLogger({ transports, level: logsConfig.level });
}

/** @type {Map<LoggerType, winston.Logger>} */
const loggers = new Map([
  ['app', createLogger(config.get('logs.app'))],
  ['http', createLogger(config.get('logs.http'))],
]);

/** @type {Map<LoggerType, string>} */
const defaultLevels = new Map(
  Array.from(loggers.entries()).map(([type, logger]) => [type, logger.level]),
);

/** @type {Map<LoggerType, NodeJS.Timeout>} */
const levelChangeTimeouts = new Map();

/**
 * Reset the log level of a given logger type
 * @param {LoggerType} type - The logger type
 */
function resetLevel(type) {
  clearTimeout(levelChangeTimeouts.get(type));
  const logger = loggers.get(type);
  if (logger) {
    logger.level = defaultLevels.get(type) ?? 'info';
  }
}

/**
 * Return the current level for a given logger type
 * @param {LoggerType} type - The logger type
 * @returns {string | undefined}
 */
function getLevel(type) {
  return loggers.get(type)?.level;
}

/**
 * Set the log level for a given logger type
 * @param {LoggerType} type - The logger type
 * @param {string} level - The new log level
 */
function setLevel(type, level) {
  const logger = loggers.get(type);

  if (!logger) { return; }

  logger.level = level;
}

/**
 * Temporary set the log level for a given logger type
 * @param {LoggerType} type - The logger type
 * @param {string} level - The new log level
 * @param {number} durationSeconds - Duration in seconds before switching back to default level
 */
function setTemporaryLevel(type, level, durationSeconds) {
  const logger = loggers.get(type);

  if (!logger || !level || !Number.isInteger(durationSeconds)) { return; }

  logger.level = level;

  clearTimeout(levelChangeTimeouts.get(type));
  levelChangeTimeouts.set(type, setTimeout(resetLevel, durationSeconds * 1000, type));
}

/**
 * Return the available levels for a given logger type, sorted by granularity
 * @param {LoggerType} type - The logger type
 * @returns {string[]}
 */
function getLevels(type) {
  return Object.entries(loggers.get(type)?.levels ?? {})
    .sort(([, a], [, b]) => a - b)
    .map(([level]) => level);
}

module.exports = {
  appLogger: loggers.get('app'),
  httpLogger: loggers.get('http'),
  getLevel,
  getLevels,
  setLevel,
  setTemporaryLevel,
};

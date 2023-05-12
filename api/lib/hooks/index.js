// @ts-check
const EventEmitter = require('node:events');

const ezrHandler = require('./ezreeport');
const elasticHandler = require('./elastic');

const eventEmitter = new EventEmitter();
const handlers = [
  ezrHandler,
  elasticHandler,
];

/**
 * Shorthand to emit given event to all handlers
 *
 * @param {string} eventName The event name to pass
 * @param  {...any} args The arguments of the event
 */
const passEvent = (eventName, ...args) => {
  // eslint-disable-next-line no-restricted-syntax
  for (const handler of handlers) {
    handler.emit(eventName, ...args);
  }
};

/**
 * Shorthand to register event to pass to all handlers
 *
 * @param {string} eventName The event name to register
 */
const registerEvent = (eventName) => {
  eventEmitter.on(
    eventName,
    (...args) => passEvent(eventName, ...args),
  );
};

// User events
registerEvent('user:create-admin');
registerEvent('user:create');
registerEvent('user:update');
registerEvent('user:upsert');
registerEvent('user:delete');

// Institution events
registerEvent('institution:create');
registerEvent('institution:update');
registerEvent('institution:upsert');
registerEvent('institution:delete');

// Membership events
registerEvent('membership:create');
registerEvent('membership:update');
registerEvent('membership:upsert');
registerEvent('membership:delete');

module.exports = eventEmitter;

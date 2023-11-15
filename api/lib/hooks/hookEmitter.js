const EventEmitter = require('node:events');

const { memoize, debounce } = require('lodash');
const { appLogger } = require('../services/logger');

/**
 * @callback AnyFunc
 * @param {...any} args
 * @returns {Promise<any>}
 */

/**
 * @callback QueueFunction
 * @param {Function} fn - A function to be queued
 * @returns {AnyFunc} a new queued function
 */

/**
 * Create a queue that can be used to enqueue the calls of one or more functions
 * @returns {QueueFunction} the queued function
 */
const createQueue = () => {
  const queue = [];

  const callNext = async () => {
    if (queue.length === 0) { return; }

    const { fn, args } = queue[0];

    await fn(...args);
    queue.shift();
    await callNext();
  };

  return (fn) => async (...args) => {
    queue.push({ fn, args });

    if (queue.length > 1) {
      return;
    }

    await callNext();
  };
};

const memoizeDebounce = (func, wait = 0, options = {}) => {
  const mem = memoize(() => debounce(func, wait, options));
  return (key, payload) => mem(key)(payload);
};

const hookEmitter = new EventEmitter();

/**
 * Trigger a hook
 *
 * @param {string} event The event name
 * @param {*} payload The payload of the event
 *
 * @returns Returns `true` if the event had listeners, `false` otherwise.
 */
const triggerHooks = (event, payload) => {
  appLogger.verbose(`[hooks] "${event}" triggered`);
  return hookEmitter.emit(event, payload);
};

/**
 * Register a hook
 *
 * @param {string} event The event name
 * @param {(payload: any) => void} handler The handled of the hook
 * @param {Object} opts Options of the hook
 * @param {boolean} [opts.debounce] Should the hook be debounced
 * @param {(payload) => string | number} [opts.uniqueResolver]
 * @param {boolean} [opts.queue] Should the hook be queued
 *
 * @returns Returns a reference to the EventEmitter
 */
const registerHook = (event, handler, opts = { debounce: true }) => {
  let fnc = (key, payload) => handler(payload);

  if (opts.debounce) {
    fnc = memoizeDebounce(handler, 250, {});
  }

  if (opts.queue) {
    const queued = createQueue();
    fnc = (key, payload) => queued(handler)(payload);
  }

  const uniqueResolver = opts.uniqueResolver ?? ((payload) => payload.id);

  appLogger.verbose(`[hooks] "${event}" registered with options "${JSON.stringify(opts)}"`);
  return hookEmitter.on(
    event,
    (payload) => {
      const key = uniqueResolver(payload);
      return fnc(key, payload);
    },
  );
};

module.exports = {
  triggerHooks,
  registerHook,
};

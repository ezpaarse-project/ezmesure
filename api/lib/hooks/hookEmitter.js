const EventEmitter = require('node:events');

const { debounce } = require('lodash');
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
 * @param {{ debounce?: boolean, queue?: boolean }} opts Options of the hook
 *
 * @returns Returns a reference to the EventEmitter
 */
const registerHook = (event, handler, opts = { debounce: true }) => {
  let fnc = handler;

  if (opts.debounce) {
    fnc = debounce(handler);
  }

  if (opts.queue) {
    const queued = createQueue();
    fnc = queued(handler);
  }

  appLogger.verbose(`[hooks] "${event}" registered with options "${JSON.stringify(opts)}"`);
  return hookEmitter.on(event, fnc);
};

module.exports = {
  triggerHooks,
  registerHook,
};

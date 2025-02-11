// @ts-check

const { triggerHooks } = require('../hooks/hookEmitter');
const { client } = require('../services/prisma');

/* eslint-disable max-len */
/** @typedef {import('@prisma/client').Prisma.TransactionClient} TransactionClient */
/* eslint-enable max-len */

/**
 * @typedef {Object} BasePrismaServiceOptions
 * @property {boolean} [shouldTriggerHooks=true] Should trigger hooks when using methods of the
 * service. (Default: `true`).
 */

/**
 * @template {BasePrismaService} S
 * @typedef {(service: S) => Promise<any>} Executor
 */

/**
 * @template {BasePrismaService} S
 * @typedef {(executor: Executor<S>) => ReturnType<Executor<S>>} TransactionFnc
 */

/** @abstract @class */
class BasePrismaService {
  /**
   * @type {Promise<any> | undefined} The current transaction. If `undefined` no transaction is
   * active
   */
  currentTransaction = undefined;

  /**
   * @private
   * @type {boolean} Should trigger hooks when using methods of the service. (Default: `true`).
   */
  shouldTriggerHooks = true;

  /**
   * Create a new service with a prisma client
   *
   * @param {TransactionClient | BasePrismaService} prismaOrService Prisma instance or service.
   * Default to global prisma instance, if a service is provided it'll reuse the prisma instance
   * and transaction
   * @param {BasePrismaServiceOptions} [opts] Options to configure the current instance of the
   * service
   */
  constructor(prismaOrService = client, opts = {}) {
    this.shouldTriggerHooks = opts?.shouldTriggerHooks ?? true;

    if (prismaOrService instanceof BasePrismaService) {
      this.prisma = prismaOrService.prisma;
      this.currentTransaction = prismaOrService.currentTransaction;
      return;
    }

    this.prisma = prismaOrService;
  }

  /**
   * Start a new interactive transaction
   *
   * @param {Function} executor The executor of the transaction, take a service as parameter
   * @param {BasePrismaServiceOptions} [opts] Options to configure the current instance of the
   * service
   *
   * @returns {Promise<any>} The result of the transaction
   */
  static $transaction(executor, opts = {}) {
    const currentTransaction = client.$transaction(
      (tx) => {
        const service = new this(tx, opts);
        service.currentTransaction = currentTransaction;

        return executor(service);
      },
    );

    return currentTransaction;
  }

  /**
   * Trigger a hook
   *
   * In transaction mode, the hook is triggered when the transaction commits.
   * Hooks aren't triggered if transaction rolls back.
   *
   * @param {string} action The event name
   * @param {any[]} payload The payload of the event
   *
   * @returns {boolean | Promise<boolean>} Returns `true` if the event had listeners
   * `false` otherwise. If in transaction returns a Promise resolved when the hook is triggered
   */
  triggerHooks(action, ...payload) {
    if (!this.shouldTriggerHooks) {
      return false;
    }

    if (!this.currentTransaction) {
      return triggerHooks(action, ...payload);
    }

    return this.currentTransaction.then(
      () => triggerHooks(action, ...payload),
    );
  }
}

module.exports = BasePrismaService;

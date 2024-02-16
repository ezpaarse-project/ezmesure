// @ts-check

const { triggerHooks } = require('../hooks/hookEmitter');
const { client } = require('../services/prisma');

/* eslint-disable max-len */
/** @typedef {import('@prisma/client').Prisma.TransactionClient} TransactionClient */
/* eslint-enable max-len */

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
  /** @type {Promise<any> | undefined} */
  currentTransaction = undefined;

  /**
   * @param {TransactionClient | BasePrismaService} prismaOrService
   */
  constructor(prismaOrService = client) {
    if (prismaOrService instanceof BasePrismaService) {
      this.prisma = prismaOrService.prisma;
      this.currentTransaction = prismaOrService.currentTransaction;
      return;
    }

    this.prisma = prismaOrService;
  }

  /**
   * @param {Function} executor
   * @returns
   */
  static $transaction(executor) {
    const currentTransaction = client.$transaction(
      (tx) => {
        const service = new this(tx);
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
   * @returns Returns `true` if the event had listeners, `false` otherwise.
   * If in transaction returns a Promise resolved when the hook is triggered
   */
  triggerHooks(action, ...payload) {
    if (!this.currentTransaction) {
      return triggerHooks(action, ...payload);
    }

    return this.currentTransaction.then(
      () => triggerHooks(action, ...payload),
    );
  }
}

module.exports = BasePrismaService;

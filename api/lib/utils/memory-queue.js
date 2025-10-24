// @ts-check

/**
 * @template Args
 */
module.exports = class InMemoryQueue {
  /** @type {Args[]} */
  #queue;

  /** @type {(args: Args) => Promise<void> | void} */
  #handler;

  /**
   * Create a queue that can be used to enqueue the calls of one function
   *
   * @param {(args: Args) => Promise<void> | void} handler - The handler of the queue
   */
  constructor(handler) {
    this.#queue = [];
    this.#handler = handler;
  }

  get size() {
    return this.#queue.length;
  }

  async #processNext() {
    const args = this.#queue.shift();
    if (!args) {
      return;
    }

    await this.#handler(...args);
    await this.#processNext();
  }

  /**
   * Add item to the queue
   *
   * @param {Args} args
   */
  add(...args) {
    this.#queue.push(args);
    if (this.#queue.length > 1) {
      return;
    }

    this.#processNext();
  }
};

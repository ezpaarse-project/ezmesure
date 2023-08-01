/**
 * Exec given executor by batch of concurrence.
 * If any executor fails, it trigger a hook and continue.
 *
 * Useful to avoid spamming service with high number of requests
 *
 * @param {(() => Promise<any>)[]} executors The executors
 * @param {((error: Error) => void)} errorHook Hook trigger when an executor fails.
 * @param {number} concurrence Count of "parallel" requests
 * @returns
 */
exports.execThrottledPromises = async (
  executors,
  errorHook = () => {},
  concurrence = 15,
) => {
  const toProceed = [...executors];
  let buffer = [];
  const settled = [];

  while (toProceed.length > 0) {
    // While we can add elements to buffer
    if (buffer.length < concurrence) {
      const el = toProceed.pop();
      if (el) {
        buffer.push(el);
      }
    }

    if (buffer.length >= concurrence || toProceed.length <= 0) {
      // Map executor to call hooks
      const promises = buffer.map(
        async (executor) => {
          try {
            return {
              status: 'fulfilled',
              value: await executor(),
            };
          } catch (error) {
            errorHook(error);
            return {
              status: 'rejected',
              reason: error,
            };
          }
        },
      );

      // Await for executors
      settled.push(
        // eslint-disable-next-line no-await-in-loop
        ...await Promise.allSettled(promises),
      );

      // Reset buffer
      buffer = [];
    }
  }

  return settled.reduce(
    (prev, res) => {
      const isError = res.status === 'rejected';
      return {
        fulfilled: prev.fulfilled + !isError,
        errors: prev.errors + isError,
      };
    },
    {
      fulfilled: 0,
      errors: 0,
    },
  );
};

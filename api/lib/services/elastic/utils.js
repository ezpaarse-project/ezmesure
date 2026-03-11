const { EventEmitter } = require('node:events');

// const indices = require('./indices');
const users = require('./users');
const elastic = require('.');

/**
 * @typedef {import('@elastic/elasticsearch').default.estypes.TaskInfo} TaskInfo
 */

/**
  * @typedef {object} TaskEvents
  * @property {[TaskInfo]} progress
  * @property {[TaskInfo]} end
  * @property {[Error]} error
  */

async function resetElastic() {
  if (process.env.NODE_ENV !== 'dev') { return null; }

  // FIXME: https://github.com/elastic/kibana/issues/119704
  // await indices.removeAll();
  await users.removeAll();
}

/**
 * @param {string} esTaskId - The ID of the task
 * @param {number} [intervalMs] - The interval to check for progress
 *
 * @returns {EventEmitter<TaskEvents>}
 */
function followTask(esTaskId, intervalMs = 5000) {
  /** @type {NodeJS.Timeout | undefined} */
  let timeoutId;

  /** @type {EventEmitter<TaskEvents>} */
  const events = new EventEmitter();

  const handler = async () => {
    const { body } = await elastic.tasks.get({ task_id: esTaskId });
    if (!body) {
      throw new Error('No task found');
    }

    const { task, error, completed } = body;

    if (task) {
      events.emit('progress', task);
    }

    if (error) {
      events.emit('error', new Error(`${error.type}: ${error.reason || 'Unknown reason'}`, {
        cause: error.caused_by,
      }));
    }

    if (completed) {
      clearTimeout(timeoutId);
      events.emit('end', task);
      return;
    }

    timeoutId = setTimeout(handler, intervalMs);
  };

  timeoutId = setTimeout(handler, intervalMs);

  return events;
}

module.exports = {
  resetElastic,
  followTask,
};

// @ts-check

const elastic = require('.');

/* eslint-disable max-len */
/**
 * @template T
 * @typedef {import('.').ESResponse<T>} ESResponse
 */
/**
 * @typedef {import('@elastic/elasticsearch').default.estypes.DeleteByQueryResponse} DeleteByQueryResponse
 * @typedef {import('@elastic/elasticsearch').default.estypes.TaskGetResponse} TaskGetResponse
 */
/* eslint-enable max-len */

/**
 * delete es documents by query.
 *
 * @param {string} indexName - index name.
 * @param {Object} query - ES query.
 * @param {boolean} [waitForCompletion] - should wait for completion. `false` by default
 * @param {Object} [requestConfig] - config of request (timeouts, headers, ignore, and so on).
 *
 * @return {Promise<ESResponse<DeleteByQueryResponse>>}
 */
exports.deleteByQuery = async function deleteByQuery(
  indexName,
  query,
  waitForCompletion = false,
  requestConfig = undefined,
) {
  return elastic.deleteByQuery({
    index: indexName,
    wait_for_completion: waitForCompletion,
    body: {
      query,
    },
  }, requestConfig);
};

/**
 * get task information
 *
 * @param {string} taskId The task id
 * @param {object} [requestConfig] config of request
 *
 * @returns {Promise<ESResponse<TaskGetResponse>>}
 */
exports.getTask = async function getTask(taskId, requestConfig) {
  return elastic.tasks.get({ task_id: taskId }, requestConfig);
};

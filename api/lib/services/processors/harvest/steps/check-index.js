// @ts-check

const elastic = require('../../../elastic');

const publisherIndexTemplate = require('../../../../utils/publisher-template');

const HarvestError = require('../HarvestError');

/**
 *
 * @param {string} esTaskId
 * @param {import('..').ProcessorStepParam['timeout']} timeout
 */
const waitUntilTaskComplete = (esTaskId, timeout) => {
  let timeoutId;
  let lastProgress;
  const ms = 5000;

  return new Promise((resolve) => {
    const handler = async () => {
      const { body } = await elastic.tasks.get({ task_id: esTaskId });
      if (!body) {
        throw new Error('No task found');
      }

      const { task, completed } = body;

      if (completed) {
        clearTimeout(timeoutId);
        resolve(task);
        return;
      }

      timeoutId = setTimeout(handler, ms);

      const progress = task.status.deleted || 0;
      if (progress === lastProgress) {
        return;
      }

      lastProgress = progress;
      timeout.reset();
    };

    timeoutId = setTimeout(handler, ms);
  });
};

/**
 * Create index if needed, and clean it if it exists
 *
 * @param {import('..').ProcessorStepParam} param
 */
module.exports = async function process(param) {
  const {
    task: {
      data: task,
      save: saveTask,
      steps,
      logs,
    },
    timeout,
  } = param;

  const {
    index,
    session: {
      beginDate,
      endDate,
    },
  } = task;

  const indexStep = await steps.create('index');
  await saveTask();
  logs.add('info', `Ensuring [${index}]`);
  timeout.reset();

  let indexExists;
  try {
    const { body: response } = await elastic.indices.exists({ index });
    indexExists = response;
  } catch (e) {
    throw new HarvestError(`Failed to check that index [${index}] exists`, { cause: e });
  }
  timeout.reset();

  if (indexExists) {
    let esTaskId;
    try {
      const response = await elastic.deleteByQuery({
        index,
        wait_for_completion: false,
        body: {
          query: {
            bool: {
              filter: [
                {
                  range: {
                    X_Date_Month: {
                      gte: beginDate,
                      lte: endDate,
                      format: 'date_optional_time',
                    },
                  },
                },
                {
                  term: {
                    X_Sushi_ID: task.credentialsId,
                  },
                },
                {
                  term: {
                    'Report_Header.Report_ID': task.reportType.toUpperCase(),
                  },
                },
              ],
            },
          },
        },
      });

      if (!response.body.task) {
        throw new Error('No task id in response');
      }

      esTaskId = response.body.task;
    } catch (e) {
      throw new HarvestError(`Failed to start cleaning of data of index [${index}]`, { cause: e });
    }
    timeout.reset();

    try {
      const esTask = await waitUntilTaskComplete(esTaskId, timeout);
      if (esTask.status.deleted !== esTask.status.total) {
        throw new Error('Completed but not all data was deleted');
      }
    } catch (e) {
      throw new HarvestError(`Failed to clean data of index [${index}]`, { cause: e });
    }

    await steps.end(indexStep);
    return;
  }

  try {
    await elastic.indices.create({
      index,
      body: publisherIndexTemplate,
    });
  } catch (e) {
    throw new HarvestError(`Failed to create index [${index}]`, { cause: e });
  }
  timeout.reset();

  await steps.end(indexStep);
};

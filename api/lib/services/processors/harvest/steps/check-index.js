// @ts-check

const elastic = require('../../../elastic');

const publisherIndexTemplates = require('../../../../utils/sushi-templates');

const HarvestError = require('../HarvestError');

/**
 * @typedef {Awaited<ReturnType<import('..').ProcessorStepParam['task']['steps']['create']>>} Step
 */

/**
 * @param {string} esTaskId
 * @param {Step} step
 * @param {import('..').ProcessorStepParam['task']['steps']} steps
 * @param {import('..').ProcessorStepParam['timeout']} timeout
 */
const waitUntilTaskComplete = (esTaskId, step, steps, timeout) => {
  const s = step;
  if (!s.data || !(s.data instanceof Object) || Array.isArray(s.data)) {
    s.data = {};
  }
  const { data } = s;

  let timeoutId;
  const intervalMs = 5000;

  return new Promise((resolve) => {
    const handler = async () => {
      const { body } = await elastic.tasks.get({ task_id: esTaskId });
      if (!body) {
        throw new Error('No task found');
      }

      const { task, completed } = body;

      data.deletedItems = (task.status.deleted || 0);
      data.progress = Math.floor(((task.status.deleted || 0) / (task.status.total || 1)) * 100);

      steps.update(s); // not awaited to avoid issues with timeout

      if (completed) {
        clearTimeout(timeoutId);
        resolve(task);
        return;
      }

      timeoutId = setTimeout(handler, intervalMs);

      if ((task.status.deleted || 0) !== data.deletedItems) {
        timeout.reset();
      }
    };

    timeoutId = setTimeout(handler, intervalMs);
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
    repositoryPattern,
    session: {
      beginDate,
      endDate,
    },
    counterVersion,
  } = task;

  const indexStep = await steps.create('index');
  if (!indexStep.data || !(indexStep.data instanceof Object) || Array.isArray(indexStep.data)) {
    indexStep.data = {};
  }
  indexStep.data.index = index;
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

  if (!indexExists) {
    const template = publisherIndexTemplates.get(counterVersion);
    if (!template) {
      throw new HarvestError(`Failed to get template for version [${counterVersion}]`);
    }

    try {
      await elastic.indices.create({
        index,
        body: template,
      });
    } catch (e) {
      throw new HarvestError(`Failed to create index [${index}]`, { cause: e });
    }
    timeout.reset();

    logs.add('info', `Created index [${index}]`);

    await steps.end(indexStep);
    await saveTask();
    return;
  }

  let esTaskId;
  try {
    const response = await elastic.deleteByQuery({
      index: repositoryPattern || index,
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
    const esTask = await waitUntilTaskComplete(esTaskId, indexStep, steps, timeout);
    logs.add('info', 'Index cleanup completed');
    logs.add('info', `Items deleted: ${esTask.status.deleted}`);
    await saveTask();

    if (esTask.status.deleted !== esTask.status.total) {
      throw new Error('Completed but not all data was deleted');
    }
  } catch (e) {
    throw new HarvestError(`Failed to clean data of index [${index}]`, { cause: e });
  }

  indexStep.data.progress = 100;
  await steps.end(indexStep);
};

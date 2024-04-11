// @ts-check

const elastic = require('../../../elastic');

const publisherIndexTemplate = require('../../../../utils/publisher-template');

const HarvestError = require('../HarvestError');

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

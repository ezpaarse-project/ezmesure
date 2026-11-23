// @ts-check

const HarvestJobService = require('../../../entities/harvest-job.service');

const { appLogger } = require('../../logger');

/* eslint-disable max-len */
/**
 * @typedef {import('../../../.prisma/client.mjs').Prisma.JsonValue} JsonValue
 * @typedef {{ label: string, status: string, runningTime: number, data: JsonValue, startedAt: Date, createdAt: Date, updatedAt: Date }} Step
 * @typedef {import('../../../entities/institutions.service').Institution} Institution
 * @typedef {import('../../../entities/sushi-endpoints.service').SushiEndpoint} SushiEndpoint
 * @typedef {import('../../../entities/sushi-credentials.service').SushiCredentials} SushiCredentials
 * @typedef {import('../../../entities/harvest-session.service').HarvestSession} HarvestSession
 * @typedef {import('../../../entities/harvest-job.service').HarvestJob} HarvestJob
 * @typedef {import('bullmq').Job} Job
 *
 * @typedef {SushiCredentials & { endpoint: SushiEndpoint, institution: Institution }} HarvestedCredentials
 * @typedef {HarvestJob & { session: HarvestSession, credentials: HarvestedCredentials }} JobTask
 */
/* eslint-enable max-len */

function prepareLogs() {
  /** @type {{ level: string, message: string, date: Date }[]} */
  let logs = [];

  return {
    get data() {
      return logs;
    },
    set data(value) {
      logs = value;
    },
    /**
     * Add a log to the list of logs
     *
     * @param {string} level The level of the log
     * @param {string} message The message of the log
     */
    add: (level, message) => logs.push({ level, message, date: new Date() }),
  };
}

/**
 * Prepare step management
 *
 * @param {JobTask} task The task to follow
 *
 * @returns The step management
 */
function prepareSteps(task) {
  /**
   * Create a step
   *
   * @param {string} label The label of the step
   * @param {*} data The data of the step
   *
   * @returns {Promise<Step>} A promise with the created step
   */
  const create = async (label, data = {}) => {
    const step = {
      label,
      jobId: task.id,
      startedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'running',
      runningTime: 0,
      data,
    };

    await new HarvestJobService().update({
      where: { id: task.id },
      data: {
        steps: { push: step },
      },
    });

    return step;
  };

  /**
   * Update a step
   *
   * @param {Step} step The step to update
   *
   * @returns {Promise<Step>} A promise with the updated step
   */
  // @ts-ignore
  const update = (step) => HarvestJobService.$transaction(async (harvestJobService) => {
    const { steps } = await harvestJobService.findUnique({
      where: { id: task.id },
      select: { steps: true },
    }) || {};

    const index = steps?.findIndex((s) => s?.label === step.label);
    if (!steps || index == null || index < 0) {
      throw new Error(`Step [${step.label}] is not found in task [${task.id}]`);
    }

    steps[index] = {
      ...steps[index],
      ...step,
      updatedAt: new Date(),
    };

    await harvestJobService.update({
      where: { id: task.id },
      data: {
        steps: { set: steps },
      },
    });

    return steps[index];
  });

  /**
   * End a step
   *
   * @param {Step} stepData The step to update
   * @param {*} opts
   *
   * @returns {Promise<Step>} A promise with the updated step
   */
  const end = (stepData, opts = {}) => {
    const { success = true } = opts;

    return update({
      ...stepData,
      runningTime: Date.now() - stepData.startedAt.getTime(),
      status: success ? 'finished' : 'failed',
    });
  };

  return {
    create,
    update,
    end,
  };
}

module.exports = async function prepareTask(job) {
  const { taskId } = job?.data || {};
  if (!taskId) {
    return null;
  }

  appLogger.verbose(`[Harvest Job #${job?.id}] Fetching data of task [${taskId}]`);
  /** @type {JobTask | null} */
  // @ts-ignore
  const task = await new HarvestJobService().findUnique({
    where: { id: taskId },
    include: {
      session: true,
      credentials: {
        include: {
          endpoint: true,
          institution: true,
        },
      },
    },
  });

  if (!task) {
    return null;
  }

  const logs = prepareLogs();

  const save = async () => {
    const newLogs = [...logs.data];

    // eslint-disable-next-line no-param-reassign
    logs.data = [];

    try {
      await HarvestJobService.$transaction(async (harvestJobsService) => {
        const { logs: previousLogs } = await harvestJobsService.findUnique({
          where: { id: task.id },
          select: { logs: true },
        }) || {};

        if (!previousLogs) {
          throw new Error(`Unable to find logs for [${task.id}]`);
        }

        await harvestJobsService.update({
          where: { id: task.id },
          // @ts-ignore
          data: {
            ...task,
            logs: { set: [...previousLogs, ...newLogs] },
            result: task.result || undefined,
            // Don't update the following
            steps: undefined,
            updatedAt: undefined,
            session: undefined,
            credentials: undefined,
          },
        });
      });
    } catch (error) {
      appLogger.error(`Failed to save sushi task ${task.id}`);
      appLogger.error(error.message);
    }
  };

  const finish = async (options = {}) => {
    await save();

    await new HarvestJobService().finish(task, options);
  };

  return {
    get data() {
      return task;
    },
    save,
    finish,
    logs,
    steps: prepareSteps(task),
  };
};

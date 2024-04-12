// @ts-check

const StepService = require('../../../entities/step.service');
const HarvestJobService = require('../../../entities/harvest-job.service');

const { appLogger } = require('../../logger');

/* eslint-disable max-len */
/**
 * @typedef {import('@prisma/client').Step} Step
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
    add: (level, message) => logs.push({ level, message }),
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
  const stepService = new StepService();

  /**
   * Create a step
   *
   * @param {string} label The label of the step
   * @param {*} data The data of the step
   *
   * @returns A promise with the created step
   */
  const create = (label, data = {}) => stepService.create({
    data: {
      label,
      jobId: task.id,
      startedAt: new Date(),
      status: 'running',
      runningTime: 0,
      data,
    },
  });

  /**
   * Update a step
   *
   * @param {Step} step The step to update
   *
   * @returns A promise with the updated step
   */
  const update = (step) => stepService.update({
    where: { id: step.id },
    // @ts-ignore
    data: step,
  });

  /**
   * End a step
   *
   * @param {Step} stepData The step to update
   * @param {*} opts
   *
   * @returns A promise with the updated step
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

  const harvestJobsService = new HarvestJobService();

  appLogger.verbose(`[Harvest Job #${job?.id}] Fetching data of task [${taskId}]`);
  /** @type {JobTask | null} */
  // @ts-ignore
  const task = await harvestJobsService.findUnique({
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

  const save = async (logManager) => {
    const newLogs = [...logManager.data];

    // eslint-disable-next-line no-param-reassign
    logManager.data = [];

    try {
      await harvestJobsService.update({
        where: { id: task.id },
        // @ts-ignore
        data: {
          ...task,
          updatedAt: undefined,
          session: undefined,
          logs: { createMany: { data: newLogs } },
          result: task.result || undefined,
          credentials: undefined,
        },
      });
    } catch (error) {
      appLogger.error(`Failed to save sushi task ${task.id}`);
      appLogger.error(error.message);
    }
  };

  const logs = prepareLogs();

  return {
    get data() {
      return task;
    },
    save: () => save(logs),
    logs,
    steps: prepareSteps(task),
  };
};

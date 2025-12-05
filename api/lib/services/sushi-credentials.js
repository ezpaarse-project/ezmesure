// @ts-check

const { CronJob } = require('cron');
const config = require('config');

const { appLogger } = require('./logger');
const { deleteByQuery, getTask } = require('./elastic/tasks');
const { client: prisma } = require('./prisma');

/* eslint-disable max-len */
/** @typedef {import('../.prisma/client.mts').SushiCredentials} SushiCredentials */
/** @typedef {import('../.prisma/client.mts').Repository} Repository */
/* eslint-enable max-len */

const deleteConfig = config.get('counter.deleteSushi');

/** @type {Map<string, NodeJS.Timeout>} Keep track of watched jobs */
const watchedJobs = new Map();

/**
 * Map repositories into a index pattern compatible with elastic
 *
 * @param {Repository[]} repositories The repositories
 *
 * @returns {string} The index pattern
 */
function repositoriesToIndexPattern(repositories) {
  return repositories.map((repository) => repository.pattern).join(',');
}

/**
 * Stop watch credentials data deletion
 *
 * @param {string} taskId The id of the deletion task
 */
function unwatchJob(taskId) {
  const intervalId = watchedJobs.get(taskId);
  if (!intervalId) {
    return;
  }
  clearInterval(intervalId);
  watchedJobs.delete(taskId);
}

/**
 * Update credentials deletion progression, delete credentials if completed
 *
 * @param {string} taskId The id of the deletion task
 */
async function updateCredentialsDeletionProgression(taskId) {
  const { body } = await getTask(taskId);
  appLogger.verbose(`[delete-sushi][${taskId}] Got progression update`);

  const { task } = body;

  // If job is completed or cancelled, stop interval
  if (body.completed || task.status?.canceled) {
    unwatchJob(taskId);
  }

  // If job is completed without error and not cancelled, delete task from DB
  if (body.completed && !task.status?.canceled && !body.error) {
    const deleted = await prisma.sushiCredentialsDeletionTask.delete({
      where: { id: taskId },
      include: { credentials: true },
    });
    // Credentials deletion will be handled by prisma with the OnCascade
    appLogger.info(`[delete-sushi][${taskId}] Deletion task completed, deleted [${deleted.credentials.length}] credentials`);
    return;
  }

  await prisma.sushiCredentialsDeletionTask.update({
    where: { id: taskId },
    data: {
      progress: Math.floor((task.status?.deleted || 0) / (task.status?.total || 1)),
      canceled: !task.status?.canceled,
      error: body.error ? `${body.error.type} - ${body.error.reason}` : undefined,
    },
  });
}

/**
 * Watch credentials data deletion
 *
 * @param {string} taskId The id of the deletion task
 */
function watchJob(taskId) {
  const intervalId = setInterval(async () => {
    try {
      await updateCredentialsDeletionProgression(taskId);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(error);
      appLogger.error(`[delete-sushi][${taskId}] Failed to update credentials deletion progression: ${err.message}`);
      unwatchJob(taskId);
    }
  }, deleteConfig.followInterval);
  watchedJobs.set(taskId, intervalId);
}

/**
 * Start credentials data deletion
 *
 * @param {SushiCredentials[]} sushiCredentials Credentials to delete
 * @param {string} indexPattern Index pattern targeted by the task
 * @param {string} [oldId] d of the old deletion task
 */
async function startCredentialsDataDeletion(sushiCredentials, indexPattern, oldId) {
  const ids = sushiCredentials.map(({ id }) => id);

  // Start deletion of data
  const { body } = await deleteByQuery(indexPattern, {
    bool: {
      filter: [{ terms: { X_Sushi_ID: ids } }],
    },
  });

  if (!body.task) {
    return;
  }

  appLogger.debug(`[delete-sushi][${body.task}] Started deletion task with [${ids.length}] credentials`);

  const data = {
    id: `${body.task}`,
    indexPattern,
    credentials: { connect: ids.map((id) => ({ id })) },
  };

  await prisma.sushiCredentialsDeletionTask.upsert({
    where: { id: oldId ?? data.id },
    create: data,
    update: data,
  });

  watchJob(data.id);
}

/**
 * Start credentials deletions
 */
async function startCredentialsDeletions() {
  // Get credentials marked for deletion but not yet started
  const sushiCredentials = await prisma.sushiCredentials.findMany({
    where: {
      deletedAt: { not: null },
      deletionTaskId: { equals: null },
    },
    include: {
      institution: { include: { repositories: true } },
    },
  });

  /** @type {Map<string, { credentials: SushiCredentials[], indexPattern: string }>} */
  const credentialsByInstitution = new Map();
  // eslint-disable-next-line no-restricted-syntax
  for (const { institution, ...credentials } of sushiCredentials) {
    const item = credentialsByInstitution.get(institution.id) ?? { credentials: [], indexPattern: '' };

    item.credentials.push(credentials);
    if (!item.indexPattern) {
      // Map repositories into a index pattern compatible with elastic
      item.indexPattern = repositoriesToIndexPattern(institution.repositories);
    }

    credentialsByInstitution.set(institution.id, item);
  }

  // Start deletion
  // eslint-disable-next-line no-restricted-syntax
  for (const [institutionId, { credentials, indexPattern }] of credentialsByInstitution) {
    try {
      appLogger.info(`[delete-sushi] Data of credentials for [${institutionId}] are being deleted from elastic`);
      // Wait for deletion to be started to avoid overloading Elastic and/or Postgres
      // eslint-disable-next-line no-await-in-loop
      await startCredentialsDataDeletion(credentials, indexPattern);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(error);
      appLogger.error(`[delete-sushi] Data of credentials for [${institutionId}] cannot be deleted from elastic: ${err.message}`);
    }
  }
}

/**
 * Resume credentials deletions that were interrupted
 */
async function resumeCredentialsDeletions() {
  const watchedIds = Array.from(watchedJobs.keys());
  // Get credentials marked for deletion and started (and not beign watched)
  const deletionTasks = await prisma.sushiCredentialsDeletionTask.findMany({
    where: {
      id: { notIn: watchedIds },
    },
    include: {
      credentials: true,
    },
  });

  const tasksToRestart = [];

  // eslint-disable-next-line no-restricted-syntax
  for (const task of deletionTasks) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const { body } = await getTask(task.id);
      if (body.task.status?.canceled) {
        // Task is canceled, restart it
        throw new Error('Task is canceled');
      }
      // Watch if task is still in elastic
      watchJob(`${body.task}`);
    } catch (error) {
      // Task is not in elastic, restart it
      tasksToRestart.push(task);
    }
  }

  // Restart deletion
  // eslint-disable-next-line no-restricted-syntax
  for (const task of tasksToRestart) {
    try {
      // eslint-disable-next-line no-await-in-loop
      await startCredentialsDataDeletion(task.credentials, task.indexPattern, task.id);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(error);
      appLogger.error(`[delete-sushi][${task.id}] Data of credentials cannot be deleted from elastic: ${err.message}`);
    }
  }
}

async function deleteMarkedCredentials() {
  appLogger.verbose('[delete-sushi] Starting credentials deletions');
  await startCredentialsDeletions();

  await resumeCredentialsDeletions();
  appLogger.verbose('[delete-sushi] Credentials deletions ended');
}

async function startCron() {
  const job = CronJob.from({
    cronTime: deleteConfig.schedule,
    runOnInit: true,
    onTick: async () => {
      await deleteMarkedCredentials();
    },
  });

  job.start();
}

module.exports = {
  startCredentialsDataDeletion,
  startCron,
};

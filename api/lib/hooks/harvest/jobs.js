// @ts-check
const { eachMonthOfInterval, parse, format } = require('date-fns');

const { registerHook, triggerHooks } = require('../hookEmitter');

const { appLogger } = require('../../services/logger');
const { SUSHI_CODES } = require('../../services/sushi');

const HarvestService = require('../../entities/harvest.service');
const HarvestJobsService = require('../../entities/harvest-job.service');
const HarvestSessionService = require('../../entities/harvest-session.service');

/* eslint-disable max-len */
/**
 * @typedef {import('../../.prisma/client.mjs').HarvestJob} HarvestJob
 * @typedef {import('../../.prisma/client.mjs').Prisma.HarvestUncheckedCreateInput} HarvestUncheckedCreateInput
 * @typedef {import('../../.prisma/client.mjs').Prisma.HarvestUpdateInput} HarvestUpdateInput
 * @typedef {import('../../.prisma/client.mjs').Prisma.HarvestUpdateManyArgs} HarvestUpdateManyArgs
*/
/* eslint-enable max-len */

const HARVEST_FORMAT = 'yyyy-MM';

const SUSHI_CODES_UNAVAILABLE_PERIODS = new Set([
  SUSHI_CODES.unavailablePeriod,
  SUSHI_CODES.usageNotReadyForRequestedDates,
  SUSHI_CODES.usageNotAvailable,
].map((c) => `sushi:${c}`));

/**
 * @param {HarvestJob} harvestJob
 * @param {string[]} periods
 */
const onHarvestJobFailed = async (harvestJob, periods) => {
  const jobSlug = `${harvestJob.credentialsId}:${harvestJob.reportType}`;
  const { credentialsId } = harvestJob;
  if (!credentialsId) {
    return;
  }

  const harvestService = new HarvestService();

  // Handle some SUSHI codes
  if (SUSHI_CODES_UNAVAILABLE_PERIODS.has(harvestJob.errorCode || '')) {
    try {
      const count = await harvestService.updateMany({
        where: {
          credentialsId,
          reportId: harvestJob.reportType,
          period: { in: periods },
        },
        data: {
          status: 'missing',
        },
      });
      appLogger.verbose(`[harvest][hooks][${jobSlug}] Updated [${count}] harvest states as missing from SUSHI code`);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(`${error}`);
      appLogger.error(`[harvest][hooks][${jobSlug}] Cannot update harvest states: ${err.message}`);
    }
  }
};

/**
 * @param {HarvestJob} harvestJob
 * @param {string[]} periods
 */
const onHarvestJobFinished = async (harvestJob, periods) => {
  const jobSlug = `${harvestJob.credentialsId}:${harvestJob.reportType}`;
  const { credentialsId } = harvestJob;
  if (!credentialsId) {
    return;
  }

  const harvestService = new HarvestService();

  // Update missing periods
  try {
    const missingPeriods = new Set(periods)
      .difference(new Set(harvestJob.result?.coveredPeriods ?? []));

    if (missingPeriods.size > 0) {
      const count = await harvestService.updateMany({
        where: {
          credentialsId,
          reportId: harvestJob.reportType,
          period: { in: Array.from(missingPeriods) },
        },
        data: {
          status: 'missing',
          errorCode: `sushi:${SUSHI_CODES.unavailablePeriod}`,
        },
      });
      appLogger.verbose(`[harvest][hooks][${jobSlug}] Updated [${count}] harvest states as missing in report`);
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error(`${error}`);
    appLogger.error(`[harvest][hooks][${jobSlug}] Cannot update harvest states: ${err.message}`);
  }
};

/**
 * @param {HarvestJob} harvestJob
 */
const onHarvestJobEnd = async (harvestJob) => {
  // Check if a job is still active. If not, trigger hook as session ended
  const { id: activeCount } = await (new HarvestJobsService()).count({
    where: {
      sessionId: harvestJob.sessionId,
      NOT: HarvestJobsService.whereSoftDeleted,
      status: { notIn: HarvestJobsService.endStatuses },
    },
    select: { id: true },
  });

  const session = await (new HarvestSessionService()).findUnique({
    where: { id: harvestJob.sessionId },
  });

  if (!session || activeCount > 0) {
    return;
  }

  triggerHooks('harvest-session:end', session);
};

/**
 * @param {HarvestJob} harvestJob
 */
const onHarvestJobUpsert = async (harvestJob) => {
  const jobSlug = `${harvestJob.credentialsId}:${harvestJob.reportType}`;
  const { credentialsId } = harvestJob;
  if (!credentialsId) {
    return;
  }

  const harvestService = new HarvestService();

  const now = new Date();

  const periods = eachMonthOfInterval({
    start: parse(harvestJob.beginDate, HARVEST_FORMAT, now),
    end: parse(harvestJob.endDate, HARVEST_FORMAT, now),
  })
    .map((period) => format(period, HARVEST_FORMAT));

  // Ensuring harvest states exists
  try {
    const existing = await harvestService.count({
      where: {
        credentialsId,
        reportId: harvestJob.reportType,
        period: { in: periods },
      },
    });

    if (existing < periods.length) {
      const count = await harvestService.createMany({
        // Ignore states that already exists
        skipDuplicates: true,
        data: periods.map((period) => ({
          harvestedById: harvestJob.id,
          credentialsId,
          status: harvestJob.status,
          period,
          reportId: harvestJob.reportType,
        })),
      });
      appLogger.verbose(`[harvest][hooks][${jobSlug}] Created [${count}] harvest states`);
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error(`${error}`);
    appLogger.error(`[harvest][hooks][${jobSlug}] Cannot create harvest states: ${err.message}`);
  }

  // Update info of all states
  try {
    const count = await harvestService.updateMany({
      where: {
        credentialsId,
        reportId: harvestJob.reportType,
        period: { in: periods },
      },
      data: {
        harvestedAt: now,
        status: harvestJob.status,
        insertedItems: harvestJob.result?.inserted ?? 0,
        updatedItems: harvestJob.result?.updated ?? 0,
        failedItems: harvestJob.result?.failed ?? 0,
        errorCode: harvestJob.errorCode,
        sushiExceptions: { set: harvestJob.sushiExceptions.filter((ex) => typeof ex === 'object' && !!ex) },
      },
    });
    appLogger.verbose(`[harvest][hooks][${jobSlug}] Updated [${count}] harvest states`);
  } catch (error) {
    const err = error instanceof Error ? error : new Error(`${error}`);
    appLogger.error(`[harvest][hooks][${jobSlug}] Cannot update harvest states: ${err.message}`);
  }

  // Apply specific updates

  if (harvestJob.status === 'failed') {
    await onHarvestJobFailed(harvestJob, periods);
  }

  if (harvestJob.status === 'finished') {
    await onHarvestJobFinished(harvestJob, periods);
  }

  if (HarvestJobsService.endStatuses.includes(harvestJob.status)) {
    await onHarvestJobEnd(harvestJob);
  }
};

const queueName = 'harvestjob-harvest-sync';

registerHook('harvest-job:create', onHarvestJobUpsert, { queue: queueName });
registerHook('harvest-job:update', onHarvestJobUpsert, { queue: queueName });
registerHook('harvest-job:upsert', onHarvestJobUpsert, { queue: queueName });

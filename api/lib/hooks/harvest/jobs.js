// @ts-check
const { eachMonthOfInterval, parse, format } = require('date-fns');

const { registerHook, createQueue } = require('../hookEmitter');

const { appLogger } = require('../../services/logger');
const { SUSHI_CODES } = require('../../services/sushi');

const HarvestService = require('../../entities/harvest.service');

const queued = createQueue();

/* eslint-disable max-len */
/**
 * @typedef {import('@prisma/client').HarvestJob} HarvestJob
 * @typedef {import('@prisma/client').Prisma.HarvestUncheckedCreateInput} HarvestUncheckedCreateInput
 * @typedef {import('@prisma/client').Prisma.HarvestUncheckedUpdateInput} HarvestUncheckedUpdateInput
*/
/* eslint-enable max-len */

const HARVEST_FORMAT = 'yyyy-MM';

/**
 * @param { HarvestJob } harvestJob
 */
const onHarvestJobUpdate = queued(async (harvestJob) => {
  const now = new Date();

  /** @type {HarvestUncheckedCreateInput & HarvestUncheckedUpdateInput} */
  const harvestData = {
    harvestedAt: now,
    credentialsId: harvestJob.credentialsId,
    period: harvestJob.beginDate,
    reportId: harvestJob.reportType,
    status: harvestJob.status,
    insertedItems: harvestJob.result?.inserted || 0,
    updatedItems: harvestJob.result?.updated || 0,
    failedItems: harvestJob.result?.failed || 0,
    errorCode: harvestJob.errorCode,
    sushiExceptions: harvestJob.sushiExceptions,
  };

  let coveredPeriods;
  const periods = eachMonthOfInterval({
    start: parse(harvestJob.beginDate, HARVEST_FORMAT, now),
    end: parse(harvestJob.endDate, HARVEST_FORMAT, now),
  });
  if (harvestJob.result?.coveredPeriods) {
    coveredPeriods = new Set(harvestJob.result.coveredPeriods);
  }

  await HarvestService.$transaction(
    (harvestService) => Promise.all(
      periods.map(async (period) => {
        const periodStr = format(period, HARVEST_FORMAT);
        const harvestStateId = `${harvestJob.credentialsId}-${harvestJob.reportType}-${periodStr}`;

        try {
          const data = { ...harvestData, period: periodStr };
          if (data.status === 'finished' && !coveredPeriods?.has(periodStr)) {
            data.status = 'failed';
            data.errorCode = `sushi:${SUSHI_CODES.unavailablePeriod}`;
          }

          await harvestService.upsert({
            where: {
              credentialsId_reportId_period: {
                credentialsId: harvestJob.credentialsId,
                reportId: harvestJob.reportType,
                period: periodStr,
              },
            },
            create: data,
            update: data,
          });
          appLogger.verbose(`[harvest][hooks] Harvest state [${harvestStateId}] has been updated`);
        } catch (error) {
          appLogger.error(`[harvest][hooks] Harvest state [${harvestStateId}] cannot be updated: ${error.message}`);
        }
      }),
    ),
  );
});

registerHook('harvest-job:create', onHarvestJobUpdate, { debounce: false });
registerHook('harvest-job:update', onHarvestJobUpdate, { debounce: false });
registerHook('harvest-job:upsert', onHarvestJobUpdate, { debounce: false });

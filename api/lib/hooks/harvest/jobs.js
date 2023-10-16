// @ts-check
const { eachMonthOfInterval, parse, format } = require('date-fns');

const hookEmitter = require('../hookEmitter');
const { createQueue } = require('../utils');

const { appLogger } = require('../../services/logger');

const harvestService = require('../../entities/harvest.service');

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

  const harvestStateId = `${harvestJob.credentialsId}-${harvestJob.reportType}-${harvestJob.beginDate}`;

  const periods = eachMonthOfInterval({
    start: parse(harvestJob.beginDate, HARVEST_FORMAT, now),
    end: parse(harvestJob.endDate, HARVEST_FORMAT, now),
  });

  await Promise.all(
    periods.map(async (period) => {
      try {
        await harvestService.upsert({
          where: {
            credentialsId_reportId_period: {
              credentialsId: harvestJob.credentialsId,
              reportId: harvestJob.reportType,
              period: format(period, HARVEST_FORMAT),
            },
          },
          create: harvestData,
          update: harvestData,
        });
        appLogger.verbose(`[harvest][hooks] Harvest state [${harvestStateId}] has been updated`);
      } catch (error) {
        appLogger.error(`[harvest][hooks] Harvest state [${harvestStateId}] cannot be updated: ${error.message}`);
      }
    }),
  );
});

hookEmitter.on('harvest-job:create', onHarvestJobUpdate);
hookEmitter.on('harvest-job:update', onHarvestJobUpdate);
hookEmitter.on('harvest-job:upsert', onHarvestJobUpdate);

module.exports = {
  onHarvestJobUpdate,
};

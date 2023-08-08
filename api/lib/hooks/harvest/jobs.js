// @ts-check
const hookEmitter = require('../hookEmitter');

const { appLogger } = require('../../services/logger');

const harvestService = require('../../entities/harvest.service');

/* eslint-disable max-len */
/**
 * @typedef {import('@prisma/client').HarvestJob} HarvestJob
 * @typedef {import('@prisma/client').Prisma.HarvestUncheckedCreateInput} HarvestUncheckedCreateInput
 * @typedef {import('@prisma/client').Prisma.HarvestUncheckedUpdateInput} HarvestUncheckedUpdateInput
*/
/* eslint-enable max-len */

/**
 * @param { HarvestJob } harvestJob
 */
const onHarvestJobUpdate = async (harvestJob) => {
  /** @type {HarvestUncheckedCreateInput & HarvestUncheckedUpdateInput} */
  const harvestData = {
    harvestedAt: new Date(),
    credentialsId: harvestJob.credentialsId,
    period: harvestJob.beginDate,
    reportId: harvestJob.reportType,
    status: harvestJob.status,
    insertedItems: harvestJob.result?.inserted || 0,
    updatedItems: harvestJob.result?.updated || 0,
    failedItems: harvestJob.result?.failed || 0,
    sushiCode: harvestJob.sushiCode,
    sushiExceptions: harvestJob.sushiExceptions,
  };

  const harvestStateId = `${harvestJob.credentialsId}-${harvestJob.reportType}-${harvestJob.beginDate}`;

  try {
    await harvestService.upsert({
      where: {
        credentialsId_reportId_period: {
          credentialsId: harvestJob.credentialsId,
          reportId: harvestJob.reportType,
          period: harvestJob.beginDate,
        },
      },
      create: harvestData,
      update: harvestData,
    });
    appLogger.verbose(`[harvest][hooks] Harvest state [${harvestStateId}] has been updated`);
  } catch (error) {
    appLogger.error(`[harvest][hooks] Harvest state [${harvestStateId}] cannot be updated: ${error.message}`);
  }
};

hookEmitter.on('harvest-job:create', onHarvestJobUpdate);
hookEmitter.on('harvest-job:update', onHarvestJobUpdate);
hookEmitter.on('harvest-job:upsert', onHarvestJobUpdate);

module.exports = {
  onHarvestJobUpdate,
};

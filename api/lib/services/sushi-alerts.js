const { CronJob } = require('cron');
const config = require('config');

const { appLogger } = require('./logger');
const SushiAlertsService = require('../entities/sushi-alerts.service');

const {
  harvestedButUnsupported: harvestedButUnsupportedConfig,
  endpoint: endpointConfig,
} = config.get('counter.alerts');

// #region HARVESTED_BUT_UNSUPPORTED

async function updateHarvestedButUnsupported() {
  appLogger.verbose('[sushi-alerts] Starting updating HARVEST_BUT_UNSUPPORTED alerts');

  const service = new SushiAlertsService();
  try {
    await service.updateHarvestedButUnsupported();
  } catch (err) {
    appLogger.error(`[sushi-alerts] Couldn't update HARVEST_BUT_UNSUPPORTED alerts: ${err instanceof Error ? err.message : err}`);
  }

  // TODO: send mail

  appLogger.verbose('[sushi-alerts] Update of HARVEST_BUT_UNSUPPORTED alerts ended');
}

const harvestButUnsupportedJob = CronJob.from({
  cronTime: harvestedButUnsupportedConfig.schedule,
  runOnInit: false,
  onTick: updateHarvestedButUnsupported,
});

async function startUpdateHarvestButUnsupportedAlerts() {
  if (harvestButUnsupportedJob.isCallbackRunning) {
    throw new Error('An update of HARVEST_BUT_UNSUPPORTED alerts is already running');
  }

  await harvestButUnsupportedJob.stop();
  // Don't await promise to avoid waiting for cron to finish
  updateHarvestedButUnsupported()
    .then(() => harvestButUnsupportedJob.start());
}

// #endregion HARVESTED_BUT_UNSUPPORTED

// #region ENDPOINT

async function updateEndpointAlerts() {
  appLogger.verbose('[sushi-alerts] Starting updating ENDPOINT alerts');

  const service = new SushiAlertsService();
  try {
    await service.updateEndpointAlerts();
  } catch (err) {
    appLogger.error(`[sushi-alerts] Couldn't update ENDPOINT alerts: ${err instanceof Error ? err.message : err}`);
  }
  // TODO: send mail

  appLogger.verbose('[sushi-alerts] Update of ENDPOINT alerts ended');
}

const endpointJob = CronJob.from({
  cronTime: endpointConfig.schedule,
  runOnInit: false,
  onTick: updateEndpointAlerts,
});

async function startUpdateEndpointAlerts() {
  if (endpointJob.isCallbackRunning) {
    throw new Error('An update of ENDPOINT alerts is already running');
  }

  await endpointJob.stop();
  // Don't await promise to avoid waiting for cron to finish
  updateEndpointAlerts()
    .then(() => endpointJob.start());
}

// #endregion HARVESTED_BUT_UNSUPPORTED

async function startCron() {
  harvestButUnsupportedJob.start();
  endpointJob.start();
}

module.exports = {
  startUpdateHarvestButUnsupportedAlerts,
  startUpdateEndpointAlerts,
  startCron,
};

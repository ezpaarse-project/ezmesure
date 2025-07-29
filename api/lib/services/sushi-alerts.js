const { CronJob } = require('cron');
const config = require('config');

const { appLogger } = require('./logger');
const SushiAlertsService = require('../entities/sushi-alerts.service');

const {
  harvestedButUnsupported: harvestedButUnsupportedConfig,
  endpoint: endpointConfig,
} = config.get('counter.alerts');

// #region HARVESTED_BUT_UNSUPPORTED

let harvestedButUnsupportedJobIsRunning = false;

async function updateHarvestedButUnsupported() {
  harvestedButUnsupportedJobIsRunning = true;
  appLogger.verbose('[sushi-alerts] Starting updating HARVEST_BUT_UNSUPPORTED alerts');

  const service = new SushiAlertsService();
  try {
    await service.updateHarvestedButUnsupported();
  } catch (err) {
    appLogger.error(`[sushi-alerts] Couldn't update HARVEST_BUT_UNSUPPORTED alerts: ${err instanceof Error ? err.message : err}`);
  }

  appLogger.verbose('[sushi-alerts] Update of HARVEST_BUT_UNSUPPORTED alerts ended');
  harvestedButUnsupportedJobIsRunning = false;
}

const harvestButUnsupportedJob = CronJob.from({
  cronTime: harvestedButUnsupportedConfig.schedule,
  runOnInit: false,
  onTick: updateHarvestedButUnsupported,
});

async function getUpdateHarvestButUnsupportedAlerts() {
  return {
    running: harvestedButUnsupportedJobIsRunning,
  };
}

async function startUpdateHarvestButUnsupportedAlerts() {
  if (harvestButUnsupportedJob.isCallbackRunning) {
    throw new Error('An update of HARVEST_BUT_UNSUPPORTED alerts is already running');
  }

  await harvestButUnsupportedJob.stop();
  // Don't await promise to avoid waiting for cron to finish
  updateHarvestedButUnsupported()
    .then(() => harvestButUnsupportedJob.start());

  return getUpdateHarvestButUnsupportedAlerts();
}

// #endregion HARVESTED_BUT_UNSUPPORTED

// #region ENDPOINT

let endpointJobIsRunning = false;

async function updateEndpointAlerts() {
  endpointJobIsRunning = true;
  appLogger.verbose('[sushi-alerts] Starting updating ENDPOINT alerts');

  const service = new SushiAlertsService();
  try {
    await service.updateEndpointAlerts();
  } catch (err) {
    appLogger.error(`[sushi-alerts] Couldn't update ENDPOINT alerts: ${err instanceof Error ? err.message : err}`);
  }

  appLogger.verbose('[sushi-alerts] Update of ENDPOINT alerts ended');
  endpointJobIsRunning = false;
}

const endpointJob = CronJob.from({
  cronTime: endpointConfig.schedule,
  runOnInit: false,
  onTick: updateEndpointAlerts,
});

async function getUpdateEndpointAlerts() {
  return {
    running: endpointJobIsRunning,
  };
}

async function startUpdateEndpointAlerts() {
  if (endpointJobIsRunning) {
    throw new Error('An update of ENDPOINT alerts is already running');
  }

  await endpointJob.stop();
  // Don't await promise to avoid waiting for cron to finish
  updateEndpointAlerts()
    .then(() => endpointJob.start());

  return getUpdateEndpointAlerts();
}

// #endregion HARVESTED_BUT_UNSUPPORTED

async function startCron() {
  harvestButUnsupportedJob.start();
  endpointJob.start();
}

module.exports = {
  getUpdateHarvestButUnsupportedAlerts,
  startUpdateHarvestButUnsupportedAlerts,
  getUpdateEndpointAlerts,
  startUpdateEndpointAlerts,
  startCron,
};

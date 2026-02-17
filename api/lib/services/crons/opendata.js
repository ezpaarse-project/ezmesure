// @ts-check
const { CronJob } = require('cron');
const { isValid: dateIsValid, isBefore: dateIsBefore } = require('date-fns');
const config = require('config');

const { appLogger } = require('../logger');
const elastic = require('../elastic');
const {
  reloadIndex,
  getDatasetsMetadata,
  getIndexCreationDate,
} = require('../opendata');

const { cron, index } = config.get('opendata');

async function startRefreshCron() {
  let indexExists = true;

  try {
    const { body } = await elastic.indices.exists({ index });
    indexExists = body;
  } catch (e) {
    appLogger.error(`[OpenData] Failed to check the index '${index}' exists: ${e.message}`);
  }

  const job = CronJob.from({
    cronTime: cron,
    runOnInit: !indexExists,
    onTick: async () => {
      let needRefresh;
      let datasets;

      try {
        datasets = await getDatasetsMetadata();
        const indexCreationDate = await getIndexCreationDate();

        if (!dateIsValid(indexCreationDate)) {
          appLogger.info('[OpenData] Index does not exist');
          needRefresh = true;
        } else {
          appLogger.info('[OpenData] Looking for dataset updates');
          needRefresh = datasets.some((dataset) => {
            const updatedAt = new Date(dataset && dataset.metas && dataset.metas.modified);
            return !dateIsValid(updatedAt) || dateIsBefore(indexCreationDate, updatedAt);
          });
        }
      } catch (e) {
        appLogger.error(`[OpenData] Failed to check OpenData status: ${e.message}`);
        return;
      }

      if (!needRefresh) {
        appLogger.info('[OpenData] Index is up-to-date');
        return;
      }

      await reloadIndex(datasets, appLogger);
    },
  });

  job.start();
}

module.exports = {
  startRefreshCron,
};

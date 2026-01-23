// @ts-check
const path = require('node:path');
const { stat: fsStats } = require('node:fs/promises');

const { subDays, isBefore } = require('date-fns');
const { CronJob } = require('cron');
const { glob } = require('glob');
const config = require('config');
const fs = require('fs-extra');

const { appLogger } = require('../logger');

const cleanConfig = config.get('counter.clean');
const storageDir = path.resolve(config.get('storage.path'), 'sushi');

async function cleanFiles() {
  const limit = subDays(new Date(), cleanConfig.maxDayAge);

  // TODO: clean temp files

  const reportPaths = await glob(
    // expression is based on who files are created
    path.resolve(storageDir, '*/*/*/*/*.json'),
  );

  appLogger.verbose(`[counter-cleanup] Found ${reportPaths.length} reports`);
  const reportRes = await Promise.allSettled(
    reportPaths.map(async (filePath) => {
      try {
        // eslint-disable-next-line no-underscore-dangle
        const stats = await fsStats(filePath, { bigint: false });

        if (!stats.birthtimeMs) {
          throw new Error('Cant get birthtime');
        }

        if (isBefore(stats.birthtime, limit)) {
          await fs.remove(filePath);
          return true;
        }
        return false;
      } catch (error) {
        appLogger.error(`[counter-cleanup] Error when ${filePath}: ${error}`);
        throw error;
      }
    }),
  );

  const reportErrors = reportRes.filter((v) => v.status === 'rejected').length;
  const reportSkipped = reportRes.filter((v) => v.value === false).length;
  const reportDeleted = reportRes.length - reportErrors - reportSkipped;

  appLogger.info(`[counter-cleanup] When cleaning reports : ${reportErrors} errors, ${reportSkipped} skipped, ${reportDeleted} deleted`);
}

async function startCleanCron() {
  const job = CronJob.from({
    cronTime: cleanConfig.schedule,
    runOnInit: true,
    onTick: async () => {
      appLogger.verbose('[counter-cleanup] Starting cleanup');
      try {
        await cleanFiles();
        appLogger.info('[counter-cleanup] Cleaned');
      } catch (e) {
        const message = e?.response?.data?.content?.message || e.message;
        appLogger.error(`[counter-cleanup] Failed to clean: ${message}`);
      }
    },
  });

  job.start();
}

module.exports = {
  startCleanCron,
};

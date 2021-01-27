const config = require('config');
const { CronJob } = require('cron');

const Institution = require('../models/Institution');

const { cron } = config.get('depositors');

/**
 * Update the depositors index
 */
async function refresh() {
  const institutions = await Institution.findAll();

  const results = { errors: false, items: [] };

  // eslint-disable-next-line no-restricted-syntax
  for (const institution of institutions) {
    const item = {
      name: institution.get('name'),
      indexPrefix: institution.get('indexPrefix'),
    };

    try {
      // eslint-disable-next-line no-await-in-loop
      const countChanged = await institution.refreshIndexCount();
      // eslint-disable-next-line no-await-in-loop
      const contactsChanged = await institution.refreshContacts();

      item.indexCount = institution.get('indexCount');
      item.docContactName = institution.get('docContactName');
      item.techContactName = institution.get('techContactName');
      item.updated = countChanged || contactsChanged;
    } catch (e) {
      item.error = e.message;
      results.errors = true;
    }

    results.items.push(item);
  }

  return results;
}

function start(appLogger) {
  const job = new CronJob(cron, async () => {
    let results;

    appLogger.info('Refreshing depositors');

    try {
      results = await refresh();
    } catch (e) {
      appLogger.error(`Failed to refresh depositors : ${e.message}`);
      return;
    }

    let updated = 0;
    let untouched = 0;
    let errors = 0;

    results.items.forEach((item) => {
      if (item.error) {
        errors += 1;
        appLogger.error(`Failed to refresh depositor ${item.name} : ${item.error}`);
      } else if (item.updated) {
        updated += 1;
      } else {
        untouched += 1;
      }
    });

    appLogger.info(`Depositors refreshed : ${updated} updated, ${untouched} untouched, ${errors} failed`);
  });

  job.start();
}


module.exports = {
  refresh,
  start,
};

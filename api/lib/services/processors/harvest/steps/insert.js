const crypto = require('node:crypto');

const { appLogger } = require('../../../logger');
const elastic = require('../../../elastic');

const transformers = require('../../../../utils/sushi-transformers');

/**
 * Insert SUSHI report into Elasticsearch
 *
 * @param {import('..').ProcessorStepParam} params
 */
module.exports = async function process(params) {
  const now = new Date();

  const {
    task: {
      data: task,
      save: saveTask,
      steps,
      logs,
    },
    timeout,
    data: { report, version },
  } = params;

  const {
    index,
    credentials,
    sessionId,
  } = task;

  // Prepare step
  const insertStep = await steps.create('insert');
  await saveTask();
  logs.add('info', `Importing report into [${index}]`);
  timeout.reset();

  // Ensure step have data
  if (!insertStep.data || !(insertStep.data instanceof Object) || Array.isArray(insertStep.data)) {
    insertStep.data = {};
  }

  // Prepare bulk
  const bulkSize = 2000;
  const bulkItems = [];
  const coveredPeriods = new Set();

  // Get transformer specific to version
  const prepareTransformer = transformers.get(version);
  if (typeof prepareTransformer !== 'function') {
    throw new Error(`Unsupported report version: ${version}`);
  }

  // Init transformer
  const reportTransformer = prepareTransformer(report);
  timeout.reset();

  // Prepare progress
  insertStep.data.totalReportItems = reportTransformer.totalItems;
  insertStep.data.processedReportItems = 0;
  insertStep.data.progress = 0;
  let lastSaveDate = Date.now();

  /**
   * @type {Object}
   * @property {number} inserted
   * @property {number} updated
   * @property {number} failed
   * @property {string[]} errors
   * @property {string[]} coveredPeriods
   */
  const response = {
    inserted: 0,
    updated: 0,
    failed: 0,
    errors: [],
    coveredPeriods: [],
  };

  /**
   * Add an error to response
   *
   * @param {string} message the error message
   */
  const addError = (message) => {
    response.failed += 1;
    if (response.errors.length < 9) {
      response.errors.push(message);
    }
  };

  /**
   * Insert items in elastic
   *
   * @param {*} bulkOps
   * @param {number} i
   */
  const insertItems = async (bulkOps, i) => {
    const { body: bulkResult } = await elastic.bulk({ body: bulkOps });

    if (!Array.isArray(bulkResult?.items)) { return; }

    bulkResult?.items.forEach((item) => {
      if (item?.index?.result === 'created') {
        response.inserted += 1;
      } else if (item?.index?.result === 'updated') {
        response.updated += 1;
      } else {
        response.failed += 1;

        if (item?.index?.error && response.errors.length < 10) {
          response.errors.push(item.index.error);
        }
      }
    });

    insertStep.data.processedReportItems = i + 1;
    insertStep.data.progress = Math.floor(((i + 1) / reportTransformer.totalItems) * 100);
  };

  // eslint-disable-next-line no-restricted-syntax
  for (const result of reportTransformer.transform()) {
    // An error occurred
    if (result.error) {
      addError(result.error);
      timeout.reset();
      // eslint-disable-next-line no-continue
      continue;
    }

    // A date linked to a metric was found, if not covered yet, add it
    if (result.date && !coveredPeriods.has(result.date)) {
      coveredPeriods.add(result.date);
      response.coveredPeriods = Array.from(coveredPeriods).sort();
      timeout.reset();
    }

    // A metric was found
    if (result.performance) {
      const {
        index: i,
        metricType,
        reportId,
        idComponents,
        item: baseItem,
      } = result.performance;

      // Prepare item
      const item = {
        X_Sushi_ID: credentials.id,
        X_Institution_ID: credentials.institutionId,
        X_Endpoint_ID: credentials.endpoint.id,
        X_Package: credentials.packages,
        X_Tags: credentials.tags,
        X_Harvested_At: now,
        X_Endpoint_Name: credentials.endpoint.vendor,
        X_Endpoint_Tags: credentials.endpoint.tags,
        X_Harvest_ID: sessionId,

        X_Date_Month: result.date,
        ...baseItem,
      };

      // Generate id
      const id = [
        result.date,
        reportId.toLowerCase(),
        metricType.toLowerCase(),
        item.X_Sushi_ID,
        crypto.createHash('sha256')
          .update(idComponents.join('|'))
          .digest('hex'),
      ].join(':');

      // Buffer item
      bulkItems.push({ index: { _index: index, _id: id } });
      bulkItems.push(item);
      timeout.reset();

      // If buffer is full, insert into elastic
      if (bulkItems.length >= bulkSize) {
        // eslint-disable-next-line no-await-in-loop
        await insertItems(bulkItems.splice(0, bulkSize), i);
        timeout.reset();

        // Save step if it's been 5 seconds since last save
        if ((Date.now() - lastSaveDate) > 5000) {
          // eslint-disable-next-line no-await-in-loop
          await steps.update(insertStep);
          lastSaveDate = Date.now();
          timeout.reset();
        }
      }
    }
  }

  // Flush buffer
  if (bulkItems.length > 0) {
    await insertItems(bulkItems, reportTransformer.totalItems);
    timeout.reset();
  }

  logs.add('info', 'Sushi harvesting terminated');
  logs.add('info', `Covered periods: ${response.coveredPeriods.join(', ')}`);
  logs.add('info', `Inserted items: ${response.inserted}`);
  logs.add('info', `Updated items: ${response.updated}`);
  logs.add('info', `Failed insertions: ${response.failed}`);

  // End step
  await steps.end(insertStep);
  task.result = response;
  task.status = 'finished';
  if (task.startedAt) {
    task.runningTime = Date.now() - task.startedAt.getTime();
  }
  await saveTask();
  appLogger.info(`Sushi report ${credentials.id} imported`);
};

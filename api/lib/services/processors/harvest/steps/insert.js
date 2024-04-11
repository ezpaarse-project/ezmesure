// @ts-check

const {
  format,
  isSameMonth,
  isLastDayOfMonth,
  isFirstDayOfMonth,
} = require('date-fns');

const crypto = require('node:crypto');

const { appLogger } = require('../../../logger');
const elastic = require('../../../elastic');

/**
 * Transform a list of attributes into an object
 *
 * @param {Array<Object>} list an array of { Type, Value } or { Name, Value } objects
 * @param {Object} opts
 * @param {string} [opts.splitValuesBy] the string used to split the values
 *
 * @returns an object representation of the list where each type becomes a property
 *          if a type appears multiple times, the value of the resulting property is an array
 */
function list2object(list, opts = {}) {
  const obj = {};
  const { splitValuesBy } = opts;

  if (!Array.isArray(list)) { return obj; }

  list.forEach((el) => {
    const elementKey = el?.Type || el?.Name;
    let elementValue = el?.Value;

    if (!elementKey || !elementValue) { return; }

    const valuesSoFar = obj[elementKey];

    if (splitValuesBy && typeof elementValue === 'string') {
      elementValue = elementValue.split(splitValuesBy);
    }

    if (valuesSoFar) {
      obj[elementKey] = [].concat(valuesSoFar).concat(elementValue);
    } else {
      obj[elementKey] = elementValue;
    }
  });

  return obj;
}

/**
 * Insert SUSHI report into Elasticsearch
 *
 * @param {import('..').ProcessorStepParam} params
 */
module.exports = async function process(params) {
  const {
    task: {
      data: task,
      save: saveTask,
      steps,
      logs,
    },
    timeout,
    data: { report },
  } = params;

  const {
    index,
    credentials,
    sessionId,
  } = task;

  const insertStep = await steps.create('insert');
  await saveTask();
  logs.add('info', `Importing report into [${index}]`);
  timeout.reset();

  if (!insertStep.data || !(insertStep.data instanceof Object) || Array.isArray(insertStep.data)) {
    insertStep.data = {};
  }

  const bulkSize = 2000;
  const bulkItems = [];
  const coveredPeriods = new Set();

  const reportHeader = {
    Created: report?.Report_Header?.Created,
    Created_By: report?.Report_Header?.Created_By,
    Customer_ID: report?.Report_Header?.Customer_ID,
    Report_ID: report?.Report_Header?.Report_ID,
    Release: report?.Report_Header?.Release,
    Report_Name: report?.Report_Header?.Report_Name,
    Institution_Name: report?.Report_Header?.Institution_Name,

    Institution_ID: list2object(report?.Report_Header?.Institution_ID),
    Report_Filters: list2object(report?.Report_Header?.Report_Filters),
    Report_Attributes: list2object(report?.Report_Header?.Report_Attributes, { splitValuesBy: '|' }),
  };
  timeout.reset();

  const reportItems = Array.isArray(report?.Report_Items) ? report.Report_Items : [];
  const totalItems = reportItems.length;

  insertStep.data.totalReportItems = totalItems;
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
   * Add an error
   *
   * @param {string} message the error message
   */
  const addError = (message) => {
    response.failed += 1;
    if (response.errors.length < 9) {
      response.errors.push(message);
    }
  };

  const insertItems = async (bulkOps) => {
    const { body: bulkResult } = await elastic.bulk({ body: bulkOps });

    if (!Array.isArray(bulkResult?.items)) { return; }

    bulkResult?.items.forEach((i) => {
      if (i?.index?.result === 'created') {
        response.inserted += 1;
      } else if (i?.index?.result === 'updated') {
        response.updated += 1;
      } else {
        response.failed += 1;

        if (i?.index?.error && response.errors.length < 10) {
          response.errors.push(i.index.error);
        }
      }
    });
  };

  for (let i = 0; i < reportItems.length; i += 1) {
    const reportItem = reportItems[i];

    const item = {
      X_Sushi_ID: credentials.id,
      X_Institution_ID: credentials.institutionId,
      X_Endpoint_ID: credentials.endpoint.id,
      X_Tags: credentials.tags,
      X_Endpoint_Tags: credentials.endpoint.tags,
      X_Harvest_ID: sessionId,

      Report_Header: reportHeader,

      Item_ID: list2object(reportItem.Item_ID),
      Item_Dates: list2object(reportItem.Item_Dates),
      Item_Attributes: list2object(reportItem.Item_Attributes),
      Publisher_ID: list2object(reportItem.Publisher_ID),

      Title: reportItem.Title,
      Item: reportItem.Item,
      Database: reportItem.Database,
      Platform: reportItem.Platform,
      Publisher: reportItem.Publisher,
      Data_Type: reportItem.Data_Type,
      YOP: reportItem.YOP,
      Section_Type: reportItem.Section_Type,
      Access_Type: reportItem.Access_Type,
      Access_Method: reportItem.Access_Method,
      Item_Contributors: reportItem.Item_Contributors,
    };
    timeout.reset();

    const itemParent = reportItem.Item_Parent;

    if (itemParent) {
      item.Item_Parent = {
        Item_ID: list2object(itemParent.Item_ID),
        Item_Dates: list2object(itemParent.Item_Dates),
        Item_Attributes: list2object(itemParent.Item_Attributes),

        Item_Name: itemParent.Item_Name,
        Data_Type: itemParent.Data_Type,
        Item_Contributors: itemParent.Item_Contributors,
      };
      timeout.reset();
    }

    const identifiers = Object.entries(item.Item_ID)
      .map(([key, value]) => `${key}:${value}`)
      .sort();
    timeout.reset();

    reportItem.Performance.forEach((performance) => {
      if (!Array.isArray(performance?.Instance)) { return; }

      const period = performance.Period;
      const perfBeginDate = new Date(period.Begin_Date);
      const perfEndDate = new Date(period.End_Date);

      if (!isSameMonth(perfBeginDate, perfEndDate)) {
        addError(
          `Item #${i} performance cover more than a month`
          + ` [${perfBeginDate} -> ${perfEndDate}]`
          + ` [ID: ${identifiers.join(', ')}]`
          + ` [Title: ${item.Title}]`,
        );
        return;
      }
      if (!isFirstDayOfMonth(perfBeginDate) || !isLastDayOfMonth(perfEndDate)) {
        addError(
          `Item #${i} performance does not cover the entire month`
          + ` [${perfBeginDate} -> ${perfEndDate}]`
          + ` [ID: ${identifiers.join(', ')}]`
          + ` [Title: ${item.Title}]`,
        );
        return;
      }

      const date = format(perfBeginDate, 'yyyy-MM');

      if (!coveredPeriods.has(date)) {
        coveredPeriods.add(date);
        response.coveredPeriods = Array.from(coveredPeriods).sort();
      }

      performance.Instance.forEach((instance) => {
        if (typeof instance?.Metric_Type !== 'string') { return; }

        const metricType = instance.Metric_Type;
        const metricCount = instance.Count;
        const reportId = reportHeader?.Report_ID || '';

        const id = [
          date,
          reportId.toLowerCase(),
          metricType.toLowerCase(),
          item.X_Sushi_ID,
          crypto
            .createHash('sha256')
            .update([
              item.YOP,
              item.Access_Method,
              item.Access_Type,
              item.Section_Type,
              item.Data_Type,
              item.Platform,
              item.Publisher,
              item.Title,
              item.Database,
              ...identifiers].join('|'))
            .digest('hex'),
        ].join(':');

        bulkItems.push({ index: { _index: index, _id: id } });
        bulkItems.push({
          ...item,
          X_Date_Month: date,
          Metric_Type: metricType,
          Count: metricCount,
          Period: period,
        });
      });
    });
    timeout.reset();

    if (bulkItems.length >= bulkSize) {
      // eslint-disable-next-line no-await-in-loop
      await insertItems(bulkItems.splice(0, bulkSize));
      insertStep.data.processedReportItems = i + 1;
      insertStep.data.progress = Math.floor(((i + 1) / totalItems) * 100);
      timeout.reset();

      if ((Date.now() - lastSaveDate) > 5000) {
        // eslint-disable-next-line no-await-in-loop
        await saveTask();
        lastSaveDate = Date.now();
        timeout.reset();
      }
    }
  }

  if (bulkItems.length > 0) {
    await insertItems(bulkItems);
    timeout.reset();
  }

  insertStep.data.processedReportItems = totalItems;
  insertStep.data.progress = 100;

  logs.add('info', 'Sushi harvesting terminated');
  logs.add('info', `Covered periods: ${response.coveredPeriods.join(', ')}`);
  logs.add('info', `Inserted items: ${response.inserted}`);
  logs.add('info', `Updated items: ${response.updated}`);
  logs.add('info', `Failed insertions: ${response.failed}`);

  await steps.end(insertStep);
  task.result = response;
  task.status = 'finished';
  if (task.startedAt) {
    task.runningTime = Date.now() - task.startedAt.getTime();
  }
  await saveTask();
  appLogger.info(`Sushi report ${credentials.id} imported`);
};

const fs = require('fs-extra');
const crypto = require('crypto');

const format = require('date-fns/format');
const isSameMonth = require('date-fns/isSameMonth');
const isLastDayOfMonth = require('date-fns/isLastDayOfMonth');
const isFirstDayOfMonth = require('date-fns/isFirstDayOfMonth');

const { appLogger } = require('../logger');
const sushiService = require('../sushi');
const elastic = require('../elastic');

const Sushi = require('../../models/Sushi');
const Task = require('../../models/Task');

const publisherIndexTemplate = require('../../utils/publisher-template');

async function importSushiReport(options = {}) {
  const {
    sushi,
    task,
    index,
    username,
    beginDate,
    endDate,
    forceDownload,
  } = options;

  const sushiData = {
    reportType: sushiService.DEFAULT_REPORT_TYPE,
    sushi,
    beginDate,
    endDate,
  };
  const reportPath = sushiService.getReportPath(sushiData);
  let report;

  function saveTask() {
    return task.save().catch((err) => {
      appLogger.error(`Failed to save sushi task ${task.getId()}`);
      appLogger.error(err.message);
    });
  }

  function deleteReportFile() {
    return fs.remove(reportPath).catch((err) => {
      appLogger.error(`Failed to delete report file ${reportPath}`);
      appLogger.error(err.message);
    });
  }

  task.newStep('download');

  try {
    report = JSON.parse(await fs.readFile(reportPath, 'utf8'));
  } catch (e) {
    if (e.code !== 'ENOENT') {
      task.fail([`Fail to read report file ${reportPath}`, e.message]);
      saveTask();
      return;
    }
  }

  if (report && !forceDownload) {
    task.log('info', 'Found a local COUNTER report file');
  } else {
    try {
      await new Promise((resolve, reject) => {
        let download = sushiService.getOngoingDownload(sushiData);

        if (download) {
          task.log('info', 'Report is already being downloaded, waiting for completion');
        } else {
          task.log('info', 'Report download initiated, waiting for completion');
          download = sushiService.initiateDownload(sushiData);
        }

        saveTask();
        download.on('finish', () => {
          task.log('info', 'Report downloaded');
          resolve();
        });
        download.on('error', reject);
      });
    } catch (e) {
      task.fail(['Failed to download the COUNTER report', e.message]);
      saveTask();
      deleteReportFile();
      return;
    }

    try {
      report = JSON.parse(await fs.readFile(reportPath, 'utf8'));
    } catch (e) {
      task.fail(['Fail to read downloaded report file', e.message]);
      saveTask();
      deleteReportFile();
      return;
    }
  }

  task.endStep('download');
  task.newStep('validation');
  task.log('info', 'Validating COUNTER report');
  await saveTask();

  const exceptions = sushiService.getExceptions(report);

  if (exceptions.length > 0) {
    let hasError = false;

    exceptions.forEach((e) => {
      const prefix = e?.Code ? `[Exception #${e.Code}]` : '[Exception]';
      const message = `${prefix} ${e?.Message}`;

      switch (e?.Severity?.toLowerCase?.()) {
        case 'fatal':
        case 'error':
          hasError = true;
          task.log('error', message);
          break;
        case 'debug':
          task.log('verbose', message);
          break;
        case 'info':
          task.log('info', message);
          break;
        case 'warning':
        default:
          task.log('warning', message);
      }

      if (e?.Data) { task.log('info', `[Add. data] ${e.Data}`); }
      if (e?.Help_URL) { task.log('info', `[Help URL] ${e.Help_URL}`); }
    });

    if (hasError) {
      task.fail(['Sushi endpoint returned exceptions']);
      deleteReportFile();
      saveTask();
      return;
    }
  }

  const { valid, errors } = sushiService.validateReport(report);

  if (!valid) {
    task.log('error', 'The report is not valid');

    if (Array.isArray(errors)) {
      errors.slice(0, 10).forEach((e) => task.log('error', e));
    }

    if (!sushi.get('ignoreReportValidation')) {
      task.fail();
      deleteReportFile();
      saveTask();
      return;
    }
  }

  task.log('info', `Importing report into '${index}'`);
  task.endStep('validation');
  task.newStep('insert');
  await saveTask();

  let indexExists;
  try {
    const { body: response } = await elastic.indices.exists({ index });
    indexExists = response;
  } catch (e) {
    task.fail([`Failed to check that index '${index}' exists`, e.message]);
    saveTask();
    return;
  }

  if (!indexExists) {
    try {
      await elastic.indices.create({
        index,
        body: publisherIndexTemplate,
      });
    } catch (e) {
      task.fail([`Failed to create index '${index}'`, e.message]);
      saveTask();
      return;
    }
  }

  const bulk = [];
  const bulkSize = 2000;
  const response = {
    inserted: 0,
    updated: 0,
    failed: 0,
    errors: [],
  };

  const coveredPeriods = new Set();

  const addError = (message) => {
    response.failed += 1;
    if (response.errors.length < 9) {
      response.errors.push(message);
    }
  };

  /**
   * Transform a list of attributes into an object
   * @param {Array<Object>} list an array of { Type, Value } or { Name, Value } objects
   * @returns an object representation of the list where each type becomes a property
   *          if a type appears multiple times, the value of the resulting property is an array
   */
  const list2object = (list, opts) => {
    const obj = {};
    const { splitValuesBy } = opts || {};

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
  };

  /**
   * Sanitize string for use in an Elasticsearch document ID
   * @param {String} str
   * @returns lowercased string with only underscores and alphanumeric characters
   */
  const sanitizeIdentifier = (str) => (str || '').replace(/[^a-z0-9_]+/gi, '_').toLowerCase();

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

  report.Report_Items.forEach((reportItem) => {
    if (!Array.isArray(reportItem.Item_ID)) {
      addError('Item has no Item_ID');
      return;
    }

    const item = {
      X_Package: sushi.get('package'),

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
    }

    reportItem.Performance.forEach((performance) => {
      if (!Array.isArray(performance.Instance)) { return; }

      const period = performance.Period;
      const perfBeginDate = new Date(period.Begin_Date);
      const perfEndDate = new Date(period.End_Date);

      if (!isSameMonth(perfBeginDate, perfEndDate)) {
        addError(`Item performance cover more than a month: ${perfBeginDate} -> ${perfEndDate}`);
        return;
      }
      if (!isFirstDayOfMonth(perfBeginDate) || !isLastDayOfMonth(perfEndDate)) {
        addError(`Item performance does not cover the entire month: ${perfBeginDate} -> ${perfEndDate}`);
        return;
      }

      const identifiers = Object.entries(item.Item_ID)
        .map(([key, value]) => `${key}:${value}`)
        .sort();

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
          sanitizeIdentifier(item.Platform),
          sanitizeIdentifier(item.Publisher),
          crypto
            .createHash('sha256')
            .update([
              item.Package,
              item.YOP,
              item.Access_Method,
              item.Access_Type,
              item.Section_Type,
              ...identifiers].join('|'))
            .digest('hex'),
        ].join(':');

        bulk.push({ index: { _index: index, _id: id } });
        bulk.push({
          ...item,
          X_Date_Month: date,
          Metric_Type: metricType,
          Count: metricCount,
          Period: period,
        });
      });
    });
  });

  for (let offset = 0; offset <= bulk.length; offset += bulkSize) {
    let bulkResult;

    try {
      // eslint-disable-next-line no-await-in-loop
      const result = await elastic.bulk(
        { body: bulk.slice(offset, offset + bulkSize) },
        { headers: { 'es-security-runas-user': username } },
      );
      bulkResult = result.body;
    } catch (e) {
      task.fail(['Failed to import performance items', e.message]).catch((err) => {
        appLogger.error('Failed to save sushi task');
        appLogger.error(err);
      });
      saveTask();
      return;
    }

    const resultItems = (bulkResult && bulkResult.items) || [];

    resultItems.forEach((i) => {
      if (!i.index) {
        response.failed += 1;
      } else if (i.index.result === 'created') {
        response.inserted += 1;
      } else if (i.index.result === 'updated') {
        response.updated += 1;
      } else {
        if (response.errors.length < 10) {
          response.errors.push(i.index.error);
        }
        response.failed += 1;
      }
    });

    task.setResult(response);
  }

  task.log('info', 'Sushi harvesting terminated');
  task.log('info', `Covered periods: ${response.coveredPeriods.join(', ')}`);
  task.log('info', `Inserted items: ${response.inserted}`);
  task.log('info', `Updated items: ${response.updated}`);
  task.log('info', `Failed insertions: ${response.failed}`);

  task.endStep('insert');
  task.setResult(response);
  task.done();
  await saveTask();
  appLogger.info(`Sushi report ${sushi.getId()} imported`);
}

async function processJob(job) {
  const { taskId } = job?.data || {};

  if (!taskId) {
    appLogger.error(`[Harvest Job #${job?.id}] No associated task ID, removing job`);
    return job.remove();
  }

  const task = await Task.findById(taskId);

  if (!task) {
    appLogger.error(`[Harvest Job #${job?.id}] Associated task [${taskId}] does not exist, removing job`);
    return job.remove();
  }

  const { params: taskParams = {} } = task.getData();
  const {
    sushiId,
    beginDate,
    endDate,
  } = taskParams;

  const sushi = await Sushi.findById(sushiId);

  if (!sushi) {
    const message = `SUSHI item [${sushiId}] not found`;
    task.fail([message]);
    await task.save();
    throw new Error(message);
  }

  task.start();
  task.log('info', 'Sushi import task initiated');

  if (beginDate || endDate) {
    task.log('info', `Requested period: from ${beginDate || endDate} to ${endDate || beginDate}`);
  } else {
    task.log('info', 'No period requested, defaulting to last month');
  }

  await task.save();

  try {
    await importSushiReport({ ...taskParams, sushi, task });
  } catch (err) {
    appLogger.info(`Failed to import sushi report ${sushi.getId()}: ${err.message}`);
    task.fail(['Failed to import sushi report', err.message]);
    task.save().catch((e) => {
      appLogger.error('Failed to save sushi task');
      appLogger.error(e);
    });
    throw err;
  }

  return task.get('result');
}

module.exports = function handle(job) {
  return processJob(job);
};

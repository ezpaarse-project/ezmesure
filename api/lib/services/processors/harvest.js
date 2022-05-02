const fs = require('fs-extra');
const crypto = require('crypto');

const format = require('date-fns/format');
const isSameMonth = require('date-fns/isSameMonth');
const isLastDayOfMonth = require('date-fns/isLastDayOfMonth');
const isFirstDayOfMonth = require('date-fns/isFirstDayOfMonth');

const { appLogger } = require('../logger');
const sushiService = require('../sushi');
const elastic = require('../elastic');

const SushiEndpoint = require('../../models/SushiEndpoint');
const Sushi = require('../../models/Sushi');
const Task = require('../../models/Task');

const publisherIndexTemplate = require('../../utils/publisher-template');

class HarvestError extends Error {
  constructor(message, cause) {
    super(message);
    this.cause = cause;
  }
}

async function importSushiReport(options = {}) {
  const {
    endpoint,
    sushi,
    task,
    index,
    username,
    beginDate,
    endDate,
    forceDownload,
    harvestId,
    reportType = sushiService.DEFAULT_REPORT_TYPE,
  } = options;

  const sushiData = {
    reportType,
    sushi,
    endpoint,
    beginDate,
    endDate,
  };

  let ignoreReportValidation = endpoint.get('ignoreReportValidation');

  if (typeof options.ignoreValidation === 'boolean') {
    ignoreReportValidation = options.ignoreValidation;
  }

  const reportPath = sushiService.getReportPath(sushiData);
  let report;
  let reportContent;

  function saveTask() {
    return task.save().catch((err) => {
      appLogger.error(`Failed to save sushi task ${task.getId()}`);
      appLogger.error(err.message);
    });
  }

  const downloadStep = task.newStep('download');

  try {
    reportContent = await fs.readFile(reportPath, 'utf8');
  } catch (e) {
    if (e.code !== 'ENOENT') {
      throw new HarvestError('Failed to read report file', e);
    }
  }

  if (reportContent) {
    task.log('info', 'A local copy of the COUNTER report is already present');

    try {
      report = JSON.parse(reportContent);
    } catch (e) {
      task.log('warning', 'The report is not a valid JSON, it will be re-downloaded');
    }

    const exceptions = sushiService.getExceptions(report);
    const hasFatalException = exceptions.some((e) => {
      const severity = sushiService.getExceptionSeverity(e);
      return ['error', 'fatal'].includes(severity);
    });

    if (hasFatalException) {
      task.log('warning', 'The report contains fatal exceptions, it will be re-downloaded');
      report = null;
    }
  }

  if (!report || forceDownload) {
    try {
      await fs.remove(reportPath);
    } catch (e) {
      throw new HarvestError('Failed to delete the local copy of the report', e);
    }

    try {
      let download = sushiService.getOngoingDownload(sushiData);

      if (download) {
        task.log('info', 'Report is already being downloaded, waiting for completion');
      } else {
        task.log('info', 'Report download initiated, waiting for completion');
        download = sushiService.initiateDownload(sushiData);
      }

      await Promise.all([
        saveTask(),

        new Promise((resolve, reject) => {
          download.on('error', reject);
          download.on('finish', (response) => {
            task.log('info', 'Download complete');

            const contentType = /^\s*([^;\s]*)/.exec(response?.headers?.['content-type'])?.[1];

            if (response?.status !== 200) {
              task.log('error', `Endpoint responded with status [${response?.status}]`);
            }
            if (contentType !== 'application/json') {
              task.log('error', `Endpoint responded with [${contentType}] instead of [application/json]`);
            }
            resolve();
          });
        }),
      ]);
    } catch (e) {
      throw new HarvestError('Failed to download the COUNTER report', e);
    }

    try {
      report = JSON.parse(await fs.readFile(reportPath, 'utf8'));
    } catch (e) {
      if (e instanceof SyntaxError) {
        throw new HarvestError('The report is not a valid JSON');
      } else {
        throw new HarvestError('Fail to read downloaded report file', e);
      }
    }
  }

  const exceptions = sushiService.getExceptions(report);

  if (exceptions.length > 0) {
    let hasError = false;

    exceptions.forEach((e) => {
      const prefix = e?.Code ? `[Exception #${e.Code}]` : '[Exception]';
      const message = `${prefix} ${e?.Message}`;

      const severity = sushiService.getExceptionSeverity(e);

      switch (severity) {
        case 'fatal':
        case 'error':
          hasError = true;
          downloadStep.data.sushiErrorCode = Number.parseInt(e?.Code, 10);
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
      throw new HarvestError('The report contains exceptions');
    }
  }

  task.endStep('download');
  task.newStep('validation');
  task.log('info', 'Validating COUNTER report');
  await saveTask();

  const {
    valid,
    errors,
    reportId: foundReportId,
    unsupported,
  } = sushiService.validateReport(report);

  if (foundReportId) {
    task.log('info', `Report_ID is [${foundReportId}]`);
  } else {
    task.log('error', 'Report_ID is missing from the report header');
  }

  if (!valid) {
    if (unsupported) {
      task.log('error', 'Unsupported report type');
    }
    if (Array.isArray(errors)) {
      errors.slice(0, 10).forEach((e) => task.log('error', e));
    }

    if (!ignoreReportValidation) {
      throw new HarvestError('The report is not valid');
    } else {
      task.log('info', 'Ignoring report validation');
    }
  }

  task.log('info', `Importing report into [${index}]`);
  task.endStep('validation');
  const insertStep = task.newStep('insert');
  await saveTask();

  let indexExists;
  try {
    const { body: response } = await elastic.indices.exists({ index });
    indexExists = response;
  } catch (e) {
    throw new HarvestError(`Failed to check that index [${index}] exists`, e);
  }

  if (!indexExists) {
    try {
      await elastic.indices.create({
        index,
        body: publisherIndexTemplate,
      });
    } catch (e) {
      throw new HarvestError(`Failed to create index [${index}]`, e);
    }
  }

  const bulkItems = [];
  const bulkSize = 2000;
  const response = {
    inserted: 0,
    updated: 0,
    failed: 0,
    errors: [],
    coveredPeriods: [],
  };

  const coveredPeriods = new Set();

  const addError = (message) => {
    response.failed += 1;
    if (response.errors.length < 9) {
      response.errors.push(message);
    }
  };

  const insertItems = async (bulkOps) => {
    const { body: bulkResult } = await elastic.bulk(
      { body: bulkOps },
      { headers: { 'es-security-runas-user': username } },
    );

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

  const reportItems = Array.isArray(report?.Report_Items) ? report.Report_Items : [];
  const totalItems = reportItems.length;

  insertStep.data.totalReportItems = totalItems;
  insertStep.data.processedReportItems = 0;
  insertStep.data.progress = 0;
  let lastSaveDate = Date.now();

  for (let i = 0; i < report.Report_Items.length; i += 1) {
    const reportItem = report.Report_Items[i];

    const item = {
      X_Sushi_ID: sushi.getId(),
      X_Institution_ID: sushi.get('institutionId'),
      X_Endpoint_ID: endpoint.getId(),
      X_Package: sushi.get('package'),
      X_Endpoint_Tags: endpoint.get('tags'),
      X_Harvest_ID: harvestId,

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

    const identifiers = Object.entries(item.Item_ID)
      .map(([key, value]) => `${key}:${value}`)
      .sort();

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

    if (bulkItems.length >= bulkSize) {
      // eslint-disable-next-line no-await-in-loop
      await insertItems(bulkItems.splice(0, bulkSize));
      insertStep.data.processedReportItems = i + 1;
      insertStep.data.progress = Math.floor(((i + 1) / totalItems) * 100);

      if ((Date.now() - lastSaveDate) > 5000) {
        // eslint-disable-next-line no-await-in-loop
        await saveTask();
        lastSaveDate = Date.now();
      }
    }
  }

  if (bulkItems.length > 0) {
    await insertItems(bulkItems);
  }

  insertStep.data.processedReportItems = totalItems;
  insertStep.data.progress = 100;

  task.setResult(response);

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

  appLogger.verbose(`[Harvest Job #${job?.id}] Fetching data of task [${taskId}]`);

  const task = await Task.findById(taskId);

  if (!task) {
    appLogger.error(`[Harvest Job #${job?.id}] Associated task [${taskId}] does not exist, removing job`);
    return job.remove();
  }

  if (job.attemptsMade > 0) {
    appLogger.verbose(`[Harvest Job #${job?.id}] New attempt (total: ${job.attemptsMade + 1})`);
    task.log('info', `New attempt (total: ${job.attemptsMade + 1})`);
  }

  const { params: taskParams = {} } = task.getData();
  const {
    sushiId,
    beginDate,
    endDate,
    reportType,
  } = taskParams;

  appLogger.verbose(`[Harvest Job #${job?.id}] Fetching SUSHI credentials [${sushiId}]`);

  const sushi = await Sushi.findById(sushiId);

  if (!sushi) {
    throw new HarvestError(`SUSHI item [${sushiId}] not found`);
  }

  const endpointId = sushi.get('endpointId');
  appLogger.verbose(`[Harvest Job #${job?.id}] Fetching endpoint [${endpointId}]`);

  const endpoint = await SushiEndpoint.findById(endpointId);

  if (!endpoint) {
    throw HarvestError(`SUSHI Endpoint [${endpointId}] not found`);
  }

  task.start();
  task.log('info', 'Sushi import task initiated');
  task.log('info', `Requested report type: ${reportType?.toUpperCase?.()}`);

  if (beginDate || endDate) {
    task.log('info', `Requested period: from ${beginDate || endDate} to ${endDate || beginDate}`);
  } else {
    task.log('info', 'No period requested, defaulting to last month');
  }

  await task.save();

  try {
    await importSushiReport({
      ...taskParams,
      sushi,
      endpoint,
      task,
    });
  } catch (err) {
    appLogger.error(`Failed to import sushi report [${sushi.getId()}]`);
    task.log('error', err.message);

    if (err instanceof HarvestError) {
      if (err.cause instanceof Error) {
        task.log('error', err.cause.message);
        appLogger.error(err.cause.message);
        appLogger.error(err.cause.stack);
      }
    } else {
      appLogger.error(err.message);
      appLogger.error(err.stack);
    }

    try {
      task.fail();
      await task.save();
    } catch (e) {
      appLogger.error(`Failed to save sushi task ${task.getId()}`);
      appLogger.error(e.message);
    }

    throw err;
  }

  return task.get('result');
}

module.exports = function handle(job) {
  return processJob(job);
};

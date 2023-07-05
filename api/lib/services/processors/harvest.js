const fs = require('fs-extra');
const crypto = require('crypto');

const format = require('date-fns/format');
const isSameMonth = require('date-fns/isSameMonth');
const isLastDayOfMonth = require('date-fns/isLastDayOfMonth');
const isFirstDayOfMonth = require('date-fns/isFirstDayOfMonth');

const { appLogger } = require('../logger');
const sushiService = require('../sushi');
const elastic = require('../elastic');

const sushiCredentialsService = require('../../entities/sushi-credentials.service');
const harvestJobService = require('../../entities/harvest-job.service');
const stepService = require('../../entities/step.service');
const logService = require('../../entities/log.service');

/* eslint-disable max-len */
/** @typedef {import('../../entities/sushi-credentials.service').SushiCredentials} SushiCredentials */
/** @typedef {import('../../entities/harvest-job.service').HarvestJob} HarvestJob */
/* eslint-enable max-len */

const publisherIndexTemplate = require('../../utils/publisher-template');

class HarvestError extends Error {
  constructor(message, cause) {
    super(message);
    this.cause = cause;
  }
}

/**
 * @typedef {object} ImportOptions
 * @property {SushiCredentials} sushi - The SUSHI item to be harvested
 * @property {HarvestJob} task - The
 * @property {string} index - The elasticsearch index where the report should be imported
 * @property {string} username - The username to use for elasticsearch actions
 * @property {string} beginDate - Start date of the report period
 * @property {string} endDate - End date of the report period
 * @property {string} harvestId - Arbitrary ID to associate with this harvest job
 * @property {string} reportType - The type of report to harvest
 * @property {boolean} forceDownload - Download the report even if a local copy exists
 */

/**
 *
 * @param {ImportOptions} options
 * @returns {Promise<void>}
 */
async function importSushiReport(options = {}) {
  const {
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

  const {
    institution,
    endpoint,
  } = sushi;

  const sushiData = {
    reportType,
    sushi,
    endpoint,
    institution,
    beginDate,
    endDate,
  };

  let { ignoreReportValidation } = endpoint;

  if (typeof options.ignoreValidation === 'boolean') {
    ignoreReportValidation = options.ignoreValidation;
  }

  const reportPath = sushiService.getReportPath(sushiData);
  let report;
  let reportContent;
  let logs = [];

  function saveTask() {
    const newLogs = logs;
    logs = [];

    return harvestJobService.update({
      where: { id: task.id },
      data: {
        ...task,
        logs: { createMany: { data: newLogs } },
        result: task.result || undefined,
      },
    }).catch((err) => {
      appLogger.error(`Failed to save sushi task ${task.id}`);
      appLogger.error(err.message);
    });
  }

  function createNewStep(label, data) {
    return stepService.create({
      data: {
        label,
        jobId: task.id,
        startedAt: new Date(),
        status: 'running',
        runningTime: 0,
        data: data || {},
      },
    });
  }

  function updateStep(stepData) {
    return stepService.update({
      where: { id: stepData.id },
      data: stepData,
    });
  }

  function endStep(stepData, opts = {}) {
    const { success = true } = opts;

    return updateStep({
      ...stepData,
      runningTime: Date.now() - stepData.startedAt,
      status: success ? 'finished' : 'failed',
    });
  }

  function addLog(level, message) {
    logs.push({ level, message });
  }

  const downloadStep = await createNewStep('download');

  try {
    reportContent = await fs.readFile(reportPath, 'utf8');
  } catch (e) {
    if (e.code !== 'ENOENT') {
      throw new HarvestError('Failed to read report file', e);
    }
  }

  if (reportContent) {
    addLog('info', 'A local copy of the COUNTER report is already present');

    try {
      report = JSON.parse(reportContent);
    } catch (e) {
      addLog('warning', 'The report is not a valid JSON, it will be re-downloaded');
    }

    const exceptions = sushiService.getExceptions(report);
    const hasFatalException = exceptions.some((e) => {
      const severity = sushiService.getExceptionSeverity(e);
      return ['error', 'fatal'].includes(severity);
    });

    if (hasFatalException) {
      addLog('warning', 'The report contains fatal exceptions, it will be re-downloaded');
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
        addLog('info', 'Report is already being downloaded, waiting for completion');
      } else {
        addLog('info', 'Report download initiated, waiting for completion');
        download = sushiService.initiateDownload(sushiData);
      }

      downloadStep.data.url = download?.getUri?.({ obfuscate: true });

      await Promise.all([
        saveTask(),

        new Promise((resolve, reject) => {
          download.on('error', reject);
          download.on('finish', (response) => {
            addLog('info', 'Download complete');

            const contentType = /^\s*([^;\s]*)/.exec(response?.headers?.['content-type'])?.[1];

            downloadStep.data.statusCode = response?.status;

            if (response?.status === 202) {
              addLog('warning', `Endpoint responded with status [${response?.status}]`);
              task.status = 'delayed';
              resolve();
              return;
            }
            if (response?.status !== 200) {
              addLog('error', `Endpoint responded with status [${response?.status}]`);
            }
            if (contentType !== 'application/json') {
              addLog('error', `Endpoint responded with [${contentType}] instead of [application/json]`);
            }

            resolve();
          });
        }),
      ]);
    } catch (e) {
      throw new HarvestError('Failed to download the COUNTER report', e);
    }

    if (task.status === 'delayed') {
      await saveTask();
      return;
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
    let isDelayed = false;

    exceptions.forEach((e) => {
      const prefix = e?.Code ? `[Exception #${e.Code}]` : '[Exception]';
      const message = `${prefix} ${e?.Message}`;
      const severity = sushiService.getExceptionSeverity(e);

      if (Number.parseInt(e?.Code, 10) === 1011) {
        isDelayed = true;
      }

      switch (severity) {
        case 'fatal':
        case 'error':
          hasError = true;
          downloadStep.data.sushiErrorCode = Number.parseInt(e?.Code, 10);
          addLog('error', message);
          break;
        case 'debug':
          addLog('verbose', message);
          break;
        case 'info':
          addLog('info', message);
          break;
        case 'warning':
        default:
          addLog('warning', message);
      }

      if (e?.Data) { addLog('info', `[Add. data] ${e.Data}`); }
      if (e?.Help_URL) { addLog('info', `[Help URL] ${e.Help_URL}`); }
    });

    if (isDelayed) {
      addLog('warning', 'Endpoint has queued report for processing');
      task.status = 'delayed';
      await saveTask();
      return;
    }
    if (hasError) {
      throw new HarvestError('The report contains exceptions');
    }
  }

  await endStep(downloadStep);
  const validationStep = await createNewStep('validation');
  addLog('info', 'Validating COUNTER report');
  await saveTask();

  const {
    valid,
    errors,
    reportId: foundReportId,
    unsupported,
  } = sushiService.validateReport(report);

  if (foundReportId) {
    addLog('info', `Report_ID is [${foundReportId}]`);
  } else {
    addLog('error', 'Report_ID is missing from the report header');
  }

  if (!valid) {
    if (unsupported) {
      addLog('error', 'Unsupported report type');
    }
    if (Array.isArray(errors)) {
      errors.slice(0, 10).forEach((e) => addLog('error', e));
    }

    if (!ignoreReportValidation) {
      throw new HarvestError('The report is not valid');
    } else {
      addLog('info', 'Ignoring report validation');
    }
  }

  addLog('info', `Importing report into [${index}]`);
  await endStep(validationStep);
  const insertStep = await createNewStep('insert');
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

  for (let i = 0; i < reportItems.length; i += 1) {
    const reportItem = reportItems[i];

    const item = {
      X_Sushi_ID: sushi.id,
      X_Institution_ID: sushi.institutionId,
      X_Endpoint_ID: endpoint.id,
      X_Tags: sushi.tags,
      X_Endpoint_Tags: endpoint.tags,
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

  addLog('info', 'Sushi harvesting terminated');
  addLog('info', `Covered periods: ${response.coveredPeriods.join(', ')}`);
  addLog('info', `Inserted items: ${response.inserted}`);
  addLog('info', `Updated items: ${response.updated}`);
  addLog('info', `Failed insertions: ${response.failed}`);

  await endStep(insertStep);
  task.result = response;
  task.status = 'finished';
  if (task.startedAt) {
    task.runningTime = Date.now() - task.startedAt.getTime();
  }
  await saveTask();
  appLogger.info(`Sushi report ${sushi.id} imported`);
}

/**
 * Entrypoint of the harvest processor
 * @param {object} job - the Bull job
 * @param {HarvestJob} taskData - the job data stored in the database
 * @returns {Promise<any>}
 */
async function processJob(job, taskData) {
  const task = taskData;

  if (job.attemptsMade > 0) {
    appLogger.verbose(`[Harvest Job #${job?.id}] New attempt (total: ${job.attemptsMade + 1})`);
    await logService.log(job.id, 'info', `New attempt (total: ${job.attemptsMade + 1})`);
  }

  const { params: taskParams = {} } = task;
  const {
    sushiId,
    beginDate,
    endDate,
    reportType,
  } = taskParams;

  appLogger.verbose(`[Harvest Job #${job.id}] Fetching SUSHI credentials [${sushiId}]`);

  const sushi = await sushiCredentialsService.findUnique({
    where: { id: sushiId },
    include: {
      institution: true,
      endpoint: true,
    },
  });

  if (!sushi) {
    throw new HarvestError(`SUSHI item [${sushiId}] not found`);
  }

  task.status = 'running';
  task.startedAt = new Date();
  await logService.log(job.id, 'info', 'Sushi import task initiated');
  await logService.log(job.id, 'info', `Requested report type: ${reportType?.toUpperCase?.()}`);

  if (beginDate || endDate) {
    await logService.log(job.id, 'info', `Requested period: from ${beginDate || endDate} to ${endDate || beginDate}`);
  } else {
    await logService.log(job.id, 'info', 'No period requested, defaulting to last month');
  }

  await harvestJobService.update({
    where: { id: task.id },
    data: {
      ...task,
      result: task.result || undefined,
    },
  });

  try {
    await importSushiReport({
      ...taskParams,
      sushi,
      task,
    });
  } catch (err) {
    appLogger.error(`Failed to import sushi report [${sushi.id}]`);
    await logService.log(job.id, 'error', err.message);

    if (err instanceof HarvestError) {
      if (err.cause instanceof Error) {
        await logService.log(job.id, 'error', err.cause.message);
        appLogger.error(err.cause.message);
        appLogger.error(err.cause.stack);
      }
    } else {
      appLogger.error(err.message);
      appLogger.error(err.stack);
    }

    try {
      await harvestJobService.finish(task, { status: 'failed' });
    } catch (e) {
      appLogger.error(`Failed to save sushi task ${task.id}`);
      appLogger.error(e.message);
    }

    throw err;
  }

  return task.result;
}

module.exports = async function handle(job) {
  await job.update({ ...job.data, pid: process.pid });

  const jobTimeout = Number.isInteger(job?.data?.timeout) ? job.data.timeout : 600;
  let task;

  function exit(reason, exitCode) {
    switch (reason) {
      case 'timeout':
        process.send({ cmd: 'failed', value: { message: 'Job timed out', code: 'E_JOB_TIMEOUT' } });
        break;
      case 'cancel':
        job.discard();
        break;
      default:
    }
    process.exit(exitCode ?? 1);
  }

  const timeoutId = setTimeout(() => {
    appLogger.error(`[Harvest Job #${job?.id}] Timeout of ${jobTimeout}s exceeded, killing process`);

    if (!task) { exit('timeout', 1); }

    // Try to gracefully fail
    Promise.all([
      harvestJobService.finish(task, { status: 'failed' }),
      logService.log(task.id, 'error', `Timeout of ${jobTimeout}s exceeded`),
    ]).finally(() => { exit('timeout', 1); });

    // Kill process if it's taking too long to gracefully stop
    setTimeout(() => { exit('timeout', 1); }, 3000);
  }, jobTimeout * 1000);

  const exitHandler = (exitCode) => {
    appLogger.debug(`[Harvest Job #${job?.id}] Received SIGTERM, discarding job and exiting with code ${exitCode}`);

    // Try to gracefully fail
    Promise.all([
      harvestJobService.finish(task, { status: 'cancelled' }),
      logService.log(task.id, 'error', 'The task was cancelled'),
    ]).finally(() => { exit('cancel', exitCode); });

    // Kill process if it's taking too long to gracefully stop
    setTimeout(() => { exit('cancel', exitCode); }, 3000);
  };

  process.on('SIGTERM', exitHandler);

  const { taskId } = job?.data || {};

  appLogger.verbose(`[Harvest Job #${job?.id}] Fetching data of task [${taskId}]`);
  task = taskId && await harvestJobService.findUnique({ where: { id: taskId } });

  if (!task) {
    appLogger.error(`[Harvest Job #${job?.id}] Associated task [${taskId || 'n/a'}] does not exist, removing job`);
    clearTimeout(timeoutId);
    process.removeListener('SIGTERM', exitHandler);
    return job.remove();
  }

  let result;

  try {
    result = await processJob(job, task);
  } finally {
    clearTimeout(timeoutId);
    process.removeListener('SIGTERM', exitHandler);
  }

  return result;
};

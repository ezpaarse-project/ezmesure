const subMonths = require('date-fns/subMonths');
const isSameMonth = require('date-fns/isSameMonth');
const isLastDayOfMonth = require('date-fns/isLastDayOfMonth');
const isFirstDayOfMonth = require('date-fns/isFirstDayOfMonth');
const format = require('date-fns/format');

const os = require('os');
const crypto = require('crypto');
const config = require('config');
const axios = require('axios');
const path = require('path');
const fs = require('fs-extra');
const EventEmitter = require('events');

// Workaround because axios fails make HTTP requests over a HTTPS proxy
// https://github.com/axios/axios/issues/3459
const HttpsProxyAgent = require('https-proxy-agent');

const httpsAgent = process.env.https_proxy && new HttpsProxyAgent(process.env.https_proxy);

const Ajv = require('ajv').default;
const addFormats = require('ajv-formats').default;
const definitions = require('../utils/sushi-definitions.json');
const { appLogger } = require('../../server');

const elastic = require('./elastic');
const Task = require('../models/Task');
const publisherIndexTemplate = require('../utils/publisher-template');

const storageDir = path.resolve(config.get('storage.path'), 'sushi');
const tmpDir = path.resolve(os.tmpdir(), 'sushi');

const ajv = new Ajv({ schemas: [definitions], strict: false });
addFormats(ajv);
const validateReportSchema = ajv.getSchema('#/definitions/COUNTER_title_report');

const downloads = new Map();
const DEFAULT_REPORT_TYPE = 'tr';

// https://app.swaggerhub.com/apis/COUNTER/counter-sushi_5_0_api/

/**
 * Download a report, if not found locally or currently being downloaded
 * @param {Object} options sushi
 *                         beginDate
 *                         endDate
 */
async function getAvailableReports(sushi) {
  const {
    sushiUrl,
    requestorId,
    customerId,
    apiKey,
    params: sushiParams,
  } = sushi.getData();

  const baseUrl = sushiUrl.trim().replace(/\/+$/, '');
  const params = {};

  if (requestorId) { params.requestor_id = requestorId; }
  if (customerId) { params.customer_id = customerId; }
  if (apiKey) { params.api_key = apiKey; }

  if (Array.isArray(sushiParams)) {
    sushiParams.forEach((param) => {
      if (param.name) {
        params[param.name] = param.value;
      }
    });
  }

  const response = await axios({
    method: 'get',
    url: `${baseUrl}/reports`,
    responseType: 'json',
    params,
    httpsAgent: (baseUrl.startsWith('https') && httpsAgent) ? httpsAgent : undefined,
    proxy: (baseUrl.startsWith('https') && httpsAgent) ? false : undefined,
  });

  if (!response) {
    throw new Error('sushi endpoint didn\'t respond');
  }
  if (response.status !== 200) {
    throw new Error(`sushi endpoint responded with status ${response.status}`);
  }
  if (!response.data) {
    throw new Error('sushi endpoint didn\'t return any data');
  }

  return response;
}

async function getReport(sushi, opts = {}) {
  const options = opts || {};

  const {
    sushiUrl,
    requestorId,
    customerId,
    apiKey,
    params: sushiParams,
  } = sushi.getData();

  const {
    reportType = DEFAULT_REPORT_TYPE,
    beginDate,
    endDate,
    stream,
  } = options;

  if (!sushiUrl) {
    throw new Error('sushiUrl not set');
  }

  const baseUrl = sushiUrl.trim().replace(/\/+$/, '');
  const params = {};

  if (Array.isArray(sushiParams)) {
    sushiParams.forEach((param) => {
      if (param) {
        params[param.name] = param.value;
      }
    });
  }

  if (requestorId) { params.requestor_id = requestorId; }
  if (customerId) { params.customer_id = customerId; }
  if (apiKey) { params.api_key = apiKey; }

  const prevMonth = format(subMonths(new Date(), 1), 'yyyy-MM');

  params.begin_date = beginDate || endDate || prevMonth;
  params.end_date = endDate || beginDate || prevMonth;

  params.Attributes_To_Show = 'Access_Type|Access_Method|Section_Type|Data_Type|YOP';
  params.Access_Type = 'Controlled|OA_Gold';
  params.Section_Type = 'Article|Book|Chapter|Other|Section';

  return axios({
    method: 'get',
    url: `${baseUrl}/reports/${reportType}`,
    responseType: stream ? 'stream' : 'json',
    params,
    httpsAgent: (baseUrl.startsWith('https') && httpsAgent) ? httpsAgent : undefined,
    proxy: (baseUrl.startsWith('https') && httpsAgent) ? false : undefined,
  });
}

function getReportFilename(options) {
  const {
    reportType = DEFAULT_REPORT_TYPE,
    beginDate,
    endDate,
  } = options;

  return `${reportType}_${beginDate}_${endDate}.json`;
}

function getReportPath(options) {
  const { sushi } = options;
  return path.resolve(storageDir, sushi.getId(), getReportFilename(options));
}

function getReportTmpPath(options) {
  const { sushi } = options;
  return path.resolve(tmpDir, sushi.getId(), getReportFilename(options));
}

/**
 * Download a report, if not found locally or currently being downloaded
 * @param {Object} options sushi
 *                         beginDate
 *                         endDate
 */
async function downloadReport(options = {}) {
  const { sushi } = options;
  const reportPath = getReportPath(options);
  const tmpPath = getReportTmpPath(options);

  await fs.ensureDir(path.dirname(reportPath));
  await fs.ensureFile(tmpPath);

  const response = await getReport(sushi, { ...options, stream: true });

  // TODO: handle "try again later" and timeouts

  if (!response) {
    throw new Error('sushi endpoint didn\'t respond');
  }
  if (response.status !== 200) {
    throw new Error(`sushi endpoint responded with status ${response.status}`);
  }
  if (!response.data) {
    throw new Error('sushi endpoint didn\'t return any data');
  }

  await new Promise((resolve, reject) => {
    response.data.pipe(fs.createWriteStream(tmpPath))
      .on('finish', resolve)
      .on('error', reject);
  });

  await fs.move(tmpPath, reportPath, { overwrite: true });
}

function getOngoingDownload(options = {}) {
  return downloads.get(getReportPath(options));
}

function initiateDownload(options = {}) {
  const reportPath = getReportPath(options);
  const tmpPath = getReportTmpPath(options);

  let emitter = downloads.get(reportPath);
  if (emitter) {
    return emitter;
  }

  emitter = new EventEmitter();
  downloads.set(reportPath, emitter);

  downloadReport(options)
    .then(() => {
      emitter.emit('finish', reportPath);
      downloads.delete(reportPath);
    })
    .catch((err) => {
      emitter.emit('error', err);
      downloads.delete(reportPath);
      fs.remove(tmpPath).catch((e) => {
        appLogger.error(`Failed to delete ${tmpPath}: ${e.message}`);
      });
    });

  return emitter;
}

function validateReport(report) {
  const valid = validateReportSchema(report);
  const { errors } = validateReportSchema;

  return { valid, errors };
}

function getExceptions(sushiResponse) {
  if (!sushiResponse) { return []; }

  if (sushiResponse.Message) {
    return [sushiResponse];
  }

  if (Array.isArray(sushiResponse) && sushiResponse.some((item) => (item && item.Message))) {
    return sushiResponse;
  }

  const header = sushiResponse.Report_Header || {};
  const exceptions = Array.isArray(header.Exceptions) ? header.Exceptions : [];

  if (header.Exception) {
    exceptions.push(header.Exception);
  }
  if (sushiResponse.Exception) {
    exceptions.push(sushiResponse.Exception);
  }

  return exceptions;
}

async function importSushiReport(options = {}) {
  const {
    sushi,
    task,
    index,
    user,
    beginDate,
    endDate,
    forceDownload,
  } = options;

  const sushiData = {
    reportType: DEFAULT_REPORT_TYPE,
    sushi,
    beginDate,
    endDate,
  };
  const reportPath = getReportPath(sushiData);
  let report;

  function saveTask() {
    return task.save().catch((err) => {
      appLogger.error(`Failed to save sushi task ${task.getId()}`);
      appLogger.error(err.message);
    });
  }

  function deleteReportFile() {
    return fs.unlink(reportPath).catch((err) => {
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
        let download = getOngoingDownload(sushiData);

        if (download) {
          task.log('info', 'Report is already being downloaded, waiting for completion');
        } else {
          task.log('info', 'Report download initiated, waiting for completion');
          download = initiateDownload(sushiData);
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

  const exceptions = getExceptions(report);

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

  const { valid, errors } = validateReport(report);

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
        { headers: { 'es-security-runas-user': user.username } },
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

async function initSushiHarvest(opts = {}) {
  const options = opts || {};
  const {
    sushi,
    institution,
  } = options;

  const task = new Task({
    type: 'sushi-harvest',
    status: 'running',
    sushiId: sushi.getId(),
    institutionId: institution.getId(),
  });

  task.log('info', 'Sushi import task initiated');
  task.log('info', `Requested period: from ${options.beginDate} to ${options.endDate}`);
  await task.save();

  importSushiReport({ ...options, task })
    .catch((err) => {
      appLogger.info(`Failed to import sushi report ${sushi.getId()}: ${err.message}`);
      task.fail(['Failed to import sushi report', err.message]);
      task.save().catch((e) => {
        appLogger.error('Failed to save sushi task');
        appLogger.error(e);
      });
    });

  return task;
}

function stringifyException(exception) {
  if (!exception?.Message) { return ''; }

  const {
    Code: code,
    Severity: severity,
    Message: msg,
  } = exception;

  let message = severity ? `[${severity}] ` : '';
  message += code ? `[#${code}] ` : '';
  message += msg;
  return message;
}

module.exports = {
  getReport,
  validateReport,
  getReportFilename,
  getReportPath,
  getReportTmpPath,
  getAvailableReports,
  downloadReport,
  getOngoingDownload,
  initiateDownload,
  getExceptions,
  initSushiHarvest,
  stringifyException,
};

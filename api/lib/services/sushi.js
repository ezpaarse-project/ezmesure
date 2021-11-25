const subMonths = require('date-fns/subMonths');
const isSameMonth = require('date-fns/isSameMonth');
const isLastDayOfMonth = require('date-fns/isLastDayOfMonth');
const isFirstDayOfMonth = require('date-fns/isFirstDayOfMonth');
const format = require('date-fns/format');

const os = require('os');
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

  await fs.move(tmpPath, reportPath);
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

  if (report) {
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
    const errorMessages = exceptions.map((e) => e.Message);

    task.fail(['Sushi endpoint returned exceptions', ...errorMessages]);
    deleteReportFile();
    saveTask();
    return;
  }

  const { valid, errors } = validateReport(report);

  if (!valid) {
    task.fail(['The report is not valid', ...errors]);
    deleteReportFile();
    saveTask();
    return;
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

  const addError = (message) => {
    response.failed += 1;
    if (response.errors.length < 9) {
      response.errors.push(message);
    }
  };

  report.Report_Items.forEach((reportItem) => {
    if (!Array.isArray(reportItem.Item_ID)) {
      addError('Item has no Item_ID');
      return;
    }

    const item = {
      report_type: sushiData.reportType,
      package: sushi.get('package'),
      platform: reportItem.Platform,
      publication_title: reportItem.Title,
      year_of_publication: reportItem.YOP,
      publisher: reportItem.Publisher,
      data_type: reportItem.Data_Type,
      section_type: reportItem.Section_Type,
      access_type: reportItem.Access_Type,
      access_method: reportItem.Access_Method,
    };

    if (Array.isArray(reportItem.Item_Dates)) {
      reportItem.Item_Dates.forEach((itemDate) => {
        if (!itemDate) { return; }
        if (typeof itemDate.Type !== 'string') { return; }
        if (itemDate.Type.toLowerCase() === 'publication_date') {
          item.publication_date = itemDate.Value;
        }
      });
    }

    reportItem.Item_ID.forEach((identifier) => {
      if (!identifier) { return; }
      if (typeof identifier.Type !== 'string') { return; }

      switch (identifier.Type.toLowerCase()) {
        case 'doi':
          item.doi = identifier.Value;
          break;
        case 'print_issn':
          item.print_identifier = identifier.Value;
          break;
        case 'online_issn':
          item.online_identifier = identifier.Value;
          break;
        default:
      }
    });

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

      const idFields = [
        'print_identifier',
        'online_identifier',
        'publication_date',
        'publication_year',
        'publication_title',
        'platform',
      ];

      const date = format(perfBeginDate, 'yyyy-MM');
      const id = [date, ...idFields.map((f) => (item[f] || ''))].join('|');

      const itemPerf = { ...item, date };

      performance.Instance.forEach((instance) => {
        if (!instance) { return; }
        if (typeof instance.Metric_Type !== 'string') { return; }

        switch (instance.Metric_Type.toLowerCase()) {
          case 'unique_item_requests':
            itemPerf.uniqueItemRequests = instance.Count;
            break;
          case 'total_item_requests':
            itemPerf.totalItemRequests = instance.Count;
            break;
          case 'unique_item_investigations':
            itemPerf.uniqueItemInvestigations = instance.Count;
            break;
          case 'total_item_investigations':
            itemPerf.totalItemInvestigations = instance.Count;
            break;
          case 'unique_title_investigations':
            itemPerf.uniqueTitleInvestigations = instance.Count;
            break;
          case 'unique_title_requests':
            itemPerf.uniqueTitleRequests = instance.Count;
            break;
          default:
        }
      });

      bulk.push({ index: { _index: index, _id: id } });
      bulk.push(itemPerf);
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
  task.log('info', `Inserted items: ${response.inserted}`);
  task.log('info', `Updated items: ${response.updated}`);
  task.log('info', `Failed insertions: ${response.failed}`);
  task.endStep('insert');
  task.setResult(response);
  task.done();
  await saveTask();
  appLogger.info(`Sushi report ${sushi.getId()} imported`);
}

async function initSushiImport(opts = {}) {
  const options = opts || {};
  const {
    sushi,
    institution,
  } = options;

  const task = new Task({
    type: 'sushi-import',
    status: 'running',
    sushiId: sushi.getId(),
    institutionId: institution.getId(),
  });

  task.log('info', 'Sushi import task initiated');
  task.log('info', `Period: from ${options.beginDate} to ${options.endDate}`);
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
  initSushiImport,
  stringifyException,
};

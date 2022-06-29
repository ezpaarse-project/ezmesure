const subMonths = require('date-fns/subMonths');
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
const definitions = require('../utils/sushi-definitions-patched');
const { appLogger } = require('./logger');

const storageDir = path.resolve(config.get('storage.path'), 'sushi');
const tmpDir = path.resolve(os.tmpdir(), 'sushi');

const ajv = new Ajv({ schemas: [definitions], strict: false });
addFormats(ajv);

const reportValidators = new Map([
  ['pr', ajv.getSchema('#/definitions/COUNTER_platform_report')],
  ['dr', ajv.getSchema('#/definitions/COUNTER_database_report')],
  ['tr', ajv.getSchema('#/definitions/COUNTER_title_report')],
  ['ir', ajv.getSchema('#/definitions/COUNTER_item_report')],
]);

const downloads = new Map();
const DEFAULT_REPORT_TYPE = 'tr';

// https://app.swaggerhub.com/apis/COUNTER/counter-sushi_5_0_api/

/**
 * Download a report, if not found locally or currently being downloaded
 * @param {Object} options sushi
 *                         beginDate
 *                         endDate
 */
async function getAvailableReports(endpoint, sushi) {
  const {
    sushiUrl,
    params: endpointParams,
  } = endpoint?.getData?.();

  const {
    requestorId,
    customerId,
    apiKey,
    params: sushiParams,
  } = sushi?.getData?.();

  const baseUrl = sushiUrl.trim().replace(/\/+$/, '');
  const params = {};

  if (requestorId) { params.requestor_id = requestorId; }
  if (customerId) { params.customer_id = customerId; }
  if (apiKey) { params.api_key = apiKey; }

  endpointParams?.forEach?.((param) => {
    if (param?.name) {
      params[param.name] = param.value;
    }
  });
  sushiParams?.forEach?.((param) => {
    if (param?.name) {
      params[param.name] = param.value;
    }
  });

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

async function getReport(endpoint, sushi, opts = {}) {
  const options = opts || {};

  const {
    sushiUrl,
    params: endpointParams,
  } = endpoint.getData();

  const {
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
    throw new Error('endpoint is missing [sushiUrl]');
  }

  const baseUrl = sushiUrl.trim().replace(/\/+$/, '');
  const params = {};

  endpointParams?.forEach?.((param) => {
    if (param?.name) {
      params[param.name] = param.value;
    }
  });
  sushiParams?.forEach?.((param) => {
    if (param?.name) {
      params[param.name] = param.value;
    }
  });

  const paramNames = new Set(Object.keys(params).map((k) => k.toLowerCase()));

  if (!paramNames.has('attributes_to_show')) {
    params.Attributes_To_Show = 'Access_Type|Access_Method|Section_Type|Data_Type|YOP';
  }
  if (!paramNames.has('access_type')) {
    params.Access_Type = 'Controlled|OA_Gold';
  }
  if (!paramNames.has('section_type')) {
    params.Section_Type = 'Article|Book|Chapter|Other|Section';
  }

  if (requestorId) { params.requestor_id = requestorId; }
  if (customerId) { params.customer_id = customerId; }
  if (apiKey) { params.api_key = apiKey; }

  const prevMonth = format(subMonths(new Date(), 1), 'yyyy-MM');

  params.begin_date = beginDate || endDate || prevMonth;
  params.end_date = endDate || beginDate || prevMonth;

  return axios({
    method: 'get',
    url: `${baseUrl}/reports/${reportType}`,
    responseType: stream ? 'stream' : 'json',
    validateStatus: false,
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
  const {
    sushi,
    endpoint,
    institution,
    reportType = DEFAULT_REPORT_TYPE,
  } = options;
  const indexPrefix = institution.get('indexPrefix');

  return path.resolve(
    storageDir,
    indexPrefix || 'no_prefix',
    endpoint.getId(),
    sushi.getId(),
    reportType,
    getReportFilename(options),
  );
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
  const { endpoint, sushi } = options;
  const reportPath = getReportPath(options);
  const tmpPath = getReportTmpPath(options);

  await fs.ensureDir(path.dirname(reportPath));
  await fs.ensureFile(tmpPath);

  const response = await getReport(endpoint, sushi, { ...options, stream: true });
  // TODO: handle "try again later" and timeouts

  if (!response) {
    throw new Error('sushi endpoint didn\'t respond');
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

  return response;
}

function getOngoingDownload(options = {}) {
  return downloads.get(getReportPath(options));
}

function initiateDownload(options = {}) {
  const reportPath = getReportPath(options);
  const tmpPath = getReportTmpPath(options);

  if (downloads.has(reportPath)) {
    return downloads.get(reportPath);
  }

  const emitter = new EventEmitter();
  downloads.set(reportPath, emitter);

  downloadReport(options)
    .then((response) => {
      emitter.emit('finish', response, reportPath);
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
  const reportId = report?.Report_Header?.Report_ID;

  if (typeof reportId !== 'string') {
    return { valid: false };
  }

  const masterReportId = reportId.toLowerCase().split('_')[0];
  const validate = reportValidators.get(masterReportId);

  if (typeof validate !== 'function') {
    return { valid: false, reportId, unsupported: true };
  }

  const valid = validate(report);
  const { errors } = validate;

  return { valid, errors, reportId };
}

/**
 * Change an exception code into a severity string
 * @param {Integer} code the code of the exception
 * @returns a string representing the error severity (info, warning or error)
 */
function getExceptionSeverity(exception) {
  const severity = exception?.Severity?.toLowerCase?.();
  const code = Number.parseInt(exception?.Code, 10);

  if (typeof severity === 'string') {
    return severity;
  }

  const errorCodes = new Set([
    1000, 1010, 1020, 1030,
    2000, 2010, 2020, 2030,
    3000, 3010, 3020, 3030,
  ]);

  if (code === 0) { return 'info'; }
  if (errorCodes.has(code)) { return 'error'; }

  return 'warning';
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
  getExceptionSeverity,
  stringifyException,
  DEFAULT_REPORT_TYPE,
};

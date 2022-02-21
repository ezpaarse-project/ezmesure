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
const definitions = require('../utils/sushi-definitions.json');
const { appLogger } = require('./logger');

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
  stringifyException,
  DEFAULT_REPORT_TYPE,
};

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

/**
 * @typedef {import('@prisma/client').SushiCredentials} SushiCredentials
 */

const reportValidators = new Map([
  ['pr', ajv.getSchema('#/definitions/COUNTER_platform_report')],
  ['dr', ajv.getSchema('#/definitions/COUNTER_database_report')],
  ['tr', ajv.getSchema('#/definitions/COUNTER_title_report')],
  ['ir', ajv.getSchema('#/definitions/COUNTER_item_report')],
]);

const optionalAttributes = new Map([
  [
    'pr', [
      'Data_Type',
      'Access_Method',
    ],
  ],
  [
    'dr', [
      'Data_Type',
      'Access_Method',
    ],
  ],
  [
    'tr', [
      'Data_Type',
      'Section_Type',
      'YOP',
      'Access_Type',
      'Access_Method',
    ],
  ],
  [
    'ir', [
      'Authors',
      'Publication_Date',
      'Article_Version',
      'Parent_Title',
      'Parent_Authors',
      'Parent_Publication_Date',
      'Parent_Article_Version',
      'Parent_Data_Type',
      'Parent_DOI',
      'Parent_Proprietary_ID',
      'Parent_ISBN',
      'Parent_Print_ISSN',
      'Parent_Online_ISSN',
      'Parent_URI',
      'Component_Title',
      'Component_Authors',
      'Component_Publication_Date',
      'Component_Data_Type',
      'Component_DOI',
      'Component_Proprietary_ID',
      'Component_ISBN',
      'Component_Print_ISSN',
      'Component_Online_ISSN',
      'Component_URI',
      'Data_Type',
      'YOP',
      'Access_Type',
      'Access_Method',

    ],
  ],
]);

const downloads = new Map();
const DEFAULT_REPORT_TYPE = 'tr';

// https://app.swaggerhub.com/apis/COUNTER/counter-sushi_5_0_api/

/**
 * Get query parameters of a given SUSHI item
 * @param {SushiCredentials} sushiItem - The SUSHI item
 * @param {Array<string>} scopes - The scopes of the request
 * @returns {object} The query parameters
 */
function getSushiParams(sushiItem, scopes = []) {
  const allowedScopes = new Set(scopes);
  const queryParams = {};

  sushiItem?.endpoint?.params?.forEach?.((param) => {
    if (param?.name && allowedScopes.has(param.scope)) {
      queryParams[param.name] = param.value;
    }
  });

  sushiItem?.params?.forEach?.((param) => {
    if (param?.name && allowedScopes.has(param.scope)) {
      queryParams[param.name] = param.value;
    }
  });

  if (sushiItem?.requestorId) { queryParams.requestor_id = sushiItem.requestorId; }
  if (sushiItem?.customerId) { queryParams.customer_id = sushiItem.customerId; }
  if (sushiItem?.apiKey) { queryParams.api_key = sushiItem.apiKey; }

  return queryParams;
}

/**
 * Get the list of available reports for a given SUSHI item
 * @param {SushiCredentials} sushi - The SUSHI item
 * @returns {Promise<any>} The endpoint response
 */
async function getAvailableReports(sushi) {
  const {
    sushiUrl,
  } = sushi?.endpoint || {};

  const baseUrl = sushiUrl.trim().replace(/\/+$/, '');
  const allowedScopes = [undefined, 'all', 'report_list'];
  const params = getSushiParams(sushi, allowedScopes);

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

function getReportDownloadConfig(endpoint, sushi, opts = {}) {
  const options = opts || {};

  const {
    sushiUrl,
  } = endpoint;

  const paramSeparator = endpoint.paramSeparator || '|';

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

  const allowedScopes = [
    undefined,
    'all',
    'report_download',
    `report_download_${reportType}`,
  ];

  const params = getSushiParams(sushi, allowedScopes);

  const paramNames = new Set(Object.keys(params).map((k) => k.toLowerCase()));

  if (!paramNames.has('attributes_to_show')) {
    params.attributes_to_show = optionalAttributes.get(reportType)?.join?.(paramSeparator);
  }

  const prevMonth = format(subMonths(new Date(), 1), 'yyyy-MM');

  params.begin_date = beginDate || endDate || prevMonth;
  params.end_date = endDate || beginDate || prevMonth;

  return {
    method: 'get',
    url: `${baseUrl}/reports/${reportType}`,
    responseType: stream ? 'stream' : 'json',
    validateStatus: false,
    params,
    httpsAgent: (baseUrl.startsWith('https') && httpsAgent) ? httpsAgent : undefined,
    proxy: (baseUrl.startsWith('https') && httpsAgent) ? false : undefined,
  };
}

function getReportFilename(options) {
  const {
    reportType = DEFAULT_REPORT_TYPE,
    beginDate,
    endDate,
  } = options;

  return `${reportType}_${beginDate}_${endDate}.json`;
}

function getSushiDirectory(options) {
  const {
    sushi,
    institution,
  } = options;

  return path.resolve(
    storageDir,
    institution.id,
    sushi.endpointId,
    sushi.id,
  );
}

function getReportPath(options) {
  const {
    reportType = DEFAULT_REPORT_TYPE,
  } = options;

  return path.resolve(
    getSushiDirectory(options),
    reportType,
    getReportFilename(options),
  );
}

function getReportTmpPath(options) {
  const { sushi } = options;
  return path.resolve(tmpDir, sushi.id, getReportFilename(options));
}

/**
 * Download a report, if not found locally or currently being downloaded
 * @param {Object} options sushi
 *                         beginDate
 *                         endDate
 */
async function downloadReport(options = {}) {
  const {
    requestConfig,
    reportPath,
    tmpPath,
  } = options;

  await fs.ensureDir(path.dirname(reportPath));
  await fs.ensureFile(tmpPath);
  const response = await axios(requestConfig);

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

class DownloadEmitter extends EventEmitter {
  constructor(requestConfig) {
    super();
    this.config = requestConfig || {};
  }

  getUri(opts) {
    const obfuscate = !!opts?.obfuscate;
    const params = { ...this.config?.params };

    if (obfuscate && params?.requestor_id) { params.requestor_id = 'obfuscated'; }
    if (obfuscate && params?.customer_id) { params.customer_id = 'obfuscated'; }
    if (obfuscate && params?.api_key) { params.api_key = 'obfuscated'; }

    return this.config?.url && axios.getUri({
      ...this.config,
      params,
    });
  }
}

function initiateDownload(options = {}) {
  const { endpoint, sushi } = options;
  const reportPath = getReportPath(options);
  const tmpPath = getReportTmpPath(options);

  if (downloads.has(reportPath)) {
    return downloads.get(reportPath);
  }

  const requestConfig = getReportDownloadConfig(endpoint, sushi, { ...options, stream: true });
  const emitter = new DownloadEmitter(requestConfig);
  downloads.set(reportPath, emitter);

  downloadReport({ requestConfig, reportPath, tmpPath })
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
 * Check whether the given report has a Report_Item section or not
 * @param {Object} report - The report to check
 * @returns {boolean} whether the report contains a Report_Items section
 */
function hasReportItems(report) {
  return Array.isArray(report?.Report_Items);
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
  getReportDownloadConfig,
  validateReport,
  getReportFilename,
  getSushiDirectory,
  getReportPath,
  getReportTmpPath,
  getAvailableReports,
  downloadReport,
  getOngoingDownload,
  initiateDownload,
  getExceptions,
  getExceptionSeverity,
  stringifyException,
  hasReportItems,
  DEFAULT_REPORT_TYPE,
};

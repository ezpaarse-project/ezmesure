const {
  startOfMonth,
  endOfMonth,
  subDays,
  isBefore,
  subMonths,
  parseISO,
  isValid: isValidDate,
  format,
} = require('date-fns');

const { CronJob } = require('cron');
const { glob } = require('glob');

const os = require('os');
const config = require('config');
const axios = require('axios');
const path = require('path');
const fs = require('fs-extra');
const { stat: fsStats } = require('fs/promises');
const EventEmitter = require('events');

const {
  DEFAULT_REPORT_TYPE,
  REPORT_IDS,
  ERROR_CODES,
  SUSHI_CODES,
} = require('../utils/sushi-definitions/constants');
const definitions = require('../utils/sushi-definitions');
const { appLogger } = require('./logger');

const cleanConfig = config.get('counter.clean');
const storageDir = path.resolve(config.get('storage.path'), 'sushi');
const tmpDir = path.resolve(os.tmpdir(), 'sushi');

/**
 * @typedef {import('@prisma/client').SushiCredentials} SushiCredentials
 *
 * @typedef {object} SushiException
 * @property {number} Code
 * @property {string} Severity
 * @property {string} Message
 * @property {string} Data
 * @property {string} Help_URL
 */

const downloads = new Map();

// https://app.swaggerhub.com/apis/COUNTER/counter-sushi_5_0_api/

/**
 * Get SUSHI URL for a given COUNTER version
 *
 * Some endpoints uses the (non standard) prefix `/r5` for COUNTER 5 while also using `/r51`
 * for COUNTER 5.1. This methods removes the suffix `/r5` before adding the standard if
 * using COUNTER 5.1
 * It also remove the trailing `/`
 *
 * @param {import('@prisma/client').SushiEndpoint} endpoint - The endpoint
 * @param {string} [version=5] - The COUNTER version
 * @returns
 */
function getSushiURL({ sushiUrl }, version = '5') {
  const versionPrefixRegex = /(\/?r51?)?\/*$/;
  const domain = sushiUrl.trim().replace(versionPrefixRegex, '');
  const versionPrefix = versionPrefixRegex.exec(sushiUrl)?.[1];

  switch (version) {
    case '5':
      return { domain, baseUrl: `${domain}${versionPrefix || ''}` };
    case '5.1':
      return { domain, baseUrl: `${domain}/r51` };

    default:
      throw new Error(`Unsupported COUNTER version: ${version}`);
  }
}

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
 * @param {string} [version=5] - The COUNTER version
 * @returns {Promise<any>} The endpoint response
 */
async function getAvailableReports(sushi, version = '5') {
  const { baseUrl } = getSushiURL(sushi?.endpoint || {}, version);

  const allowedScopes = [undefined, 'all', 'report_list'];
  const params = getSushiParams(sushi, allowedScopes);

  const response = await axios({
    method: 'get',
    url: `${baseUrl}/reports`,
    responseType: 'json',
    params,
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

/**
 * Get the status of a endpoint using a given SUSHI item
 * @param {SushiCredentials} sushi - The SUSHI item
 * @param {string} [version=5] - The COUNTER version
 * @returns {Promise<any>} The endpoint response
 */
async function getStatus(sushi, version = '5.1') {
  const { baseUrl } = getSushiURL(sushi?.endpoint || {}, version);

  const allowedScopes = [undefined, 'all'];
  const params = getSushiParams(sushi, allowedScopes);

  const response = await axios({
    method: 'get',
    url: `${baseUrl}/alerts`,
    responseType: 'json',
    params,
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

function getReportDownloadConfig(endpoint, sushi, version, opts = {}) {
  const options = opts || {};

  const paramSeparator = endpoint.paramSeparator || '|';
  const dateFormat = endpoint.harvestDateFormat || 'yyyy-MM';

  const {
    reportType = DEFAULT_REPORT_TYPE,
    beginDate: beginDateStr,
    endDate: endDateStr,
    stream,
  } = options;

  if (!endpoint.sushiUrl) {
    throw new Error('endpoint is missing [sushiUrl]');
  }

  const { baseUrl } = getSushiURL(endpoint, version);

  const allowedScopes = [
    undefined,
    'all',
    'report_download',
    `report_download_${reportType}`,
  ];

  const params = getSushiParams({ endpoint, ...sushi }, allowedScopes);
  const paramNames = new Set(Object.keys(params).map((k) => k.toLowerCase()));
  const { defaultParameters } = definitions.get(version) ?? {};
  const paramsForReport = defaultParameters?.get(reportType) ?? {};

  Object.entries(paramsForReport).forEach(([key, value]) => {
    if (!paramNames.has(key)) {
      params[key] = Array.isArray(value) ? value.join(paramSeparator) : value;
    }
  });

  const prevMonth = subMonths(new Date(), 1);

  let beginDate = parseISO(beginDateStr || endDateStr);
  let endDate = parseISO(endDateStr || beginDateStr);

  if (!isValidDate(beginDate)) { beginDate = prevMonth; }
  if (!isValidDate(endDate)) { endDate = prevMonth; }

  params.begin_date = format(startOfMonth(beginDate), dateFormat);
  params.end_date = format(endOfMonth(endDate), dateFormat);

  return {
    method: 'get',
    url: `${baseUrl}/reports/${reportType}`,
    responseType: stream ? 'stream' : 'json',
    validateStatus: false,
    params,
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
  const { endpoint, sushi, counterVersion } = options;
  const reportPath = getReportPath(options);
  const tmpPath = getReportTmpPath(options);

  if (downloads.has(reportPath)) {
    return downloads.get(reportPath);
  }

  const requestConfig = getReportDownloadConfig(
    endpoint,
    sushi,
    counterVersion,
    { ...options, stream: true },
  );

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
  const version = report?.Report_Header?.Release;

  // Version must be present
  if (typeof version !== 'string') {
    return {
      valid: false,
    };
  }

  // Report ID must be present
  if (typeof reportId !== 'string') {
    return {
      valid: false,
      version,
    };
  }

  // Get the validator corresponding to report ID
  const lowerReportId = reportId.toLowerCase();
  const { reportValidators } = definitions.get(version) ?? {};
  let validate = reportValidators?.get(lowerReportId);
  // If no validator found, try to get the validator corresponding to the master report
  if (typeof validate !== 'function') {
    const masterReportId = lowerReportId.split('_')[0];
    validate = reportValidators?.get(masterReportId);
  }

  // If validator not found, report is unsupported
  if (typeof validate !== 'function') {
    return {
      valid: false,
      unsupported: true,
      reportId,
      version,
    };
  }

  // Run the validator
  const valid = validate(report);
  const { errors } = validate;

  return {
    valid,
    errors,
    reportId,
    version,
  };
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
    SUSHI_CODES.serviceUnavailable,
    SUSHI_CODES.serviceBusy,
    SUSHI_CODES.tooManyRequests,
    SUSHI_CODES.insufficientInformation,
    SUSHI_CODES.unauthorizedRequestor,
    SUSHI_CODES.unauthorizedRequestorAlt,
    SUSHI_CODES.invalidAPIKey,
    SUSHI_CODES.unauthorizedIPAddress,
    SUSHI_CODES.unsupportedReport,
    SUSHI_CODES.unsupportedReportVersion,
    SUSHI_CODES.invalidDates,
    SUSHI_CODES.unavailablePeriod,
  ]);

  if (code === 0) { return 'info'; }
  if (errorCodes.has(code)) { return 'error'; }

  return 'warning';
}

/**
 * Normalize a SUSHI exception object
 * Some endpoints return exceptions with different character cases
 * @param {object} obj - the base exception object
 * @returns {SushiException} the normalized exception object
 */
function normalizeException(obj) {
  if (typeof obj !== 'object') { return {}; }

  const lowerized = Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [key.toLowerCase(), value]),
  );

  const exception = {
    Code: Number.parseInt(lowerized.code, 10),
    Severity: lowerized.severity,
    Message: lowerized.message,
    Data: lowerized.data,
    Help_URL: lowerized.help_url,
  };

  return {
    ...exception,
    Severity: getExceptionSeverity(exception),
  };
}

/**
 * Extract exceptions from the body of a SUSHI response
 * @param {any} sushiResponse - The response body we got from the SUSHI endpoint
 * @returns {Array<SushiException>}
 */
function getExceptions(sushiResponse) {
  if (!sushiResponse) { return []; }

  // Look if the response is a error object, then normalize it
  if (sushiResponse.Message || sushiResponse.message) {
    return [normalizeException(sushiResponse)];
  }

  // Look if the response is an array of error objects, then normalize them
  if (
    Array.isArray(sushiResponse) && sushiResponse.some((item) => (item?.Message || item?.message))
  ) {
    return sushiResponse.map((item) => normalizeException(item));
  }

  // Look if the response is a "proper" report, then extract the exceptions
  const header = sushiResponse.Report_Header || {};
  const exceptions = Array.isArray(header.Exceptions) ? header.Exceptions : [];

  // Handle edge cases
  if (header.Exception) {
    exceptions.push(header.Exception);
  }
  if (sushiResponse.Exception) {
    exceptions.push(sushiResponse.Exception);
  }
  if (Array.isArray(sushiResponse.Exceptions)) {
    exceptions.push(...sushiResponse.Exceptions);
  }

  // Normalize the exceptions
  return exceptions.map((e) => normalizeException(e));
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

async function cleanFiles() {
  const limit = subDays(new Date(), cleanConfig.maxDayAge);

  // TODO: clean temp files

  const reportPaths = await glob(
    // expression is based on who files are created
    path.resolve(storageDir, '*/*/*/*/*.json'),
  );

  appLogger.verbose(`[counter-cleanup] Found ${reportPaths.length} reports`);
  const reportRes = await Promise.allSettled(
    reportPaths.map(async (filePath) => {
      try {
        // eslint-disable-next-line no-underscore-dangle
        const stats = await fsStats(filePath, { bigint: false });

        if (!stats.birthtimeMs) {
          throw new Error('Cant get birthtime');
        }

        if (isBefore(stats.birthtime, limit)) {
          await fs.remove(filePath);
          return true;
        }
        return false;
      } catch (error) {
        appLogger.error(`[counter-cleanup] Error when ${filePath}: ${error}`);
        throw error;
      }
    }),
  );

  const reportErrors = reportRes.filter((v) => v.status === 'rejected').length;
  const reportSkipped = reportRes.filter((v) => v.value === false).length;
  const reportDeleted = reportRes.length - reportErrors - reportSkipped;

  appLogger.info(`[counter-cleanup] When cleaning reports : ${reportErrors} errors, ${reportSkipped} skipped, ${reportDeleted} deleted`);
}

async function startCleanCron() {
  const job = CronJob.from({
    cronTime: cleanConfig.schedule,
    runOnInit: true,
    onTick: async () => {
      appLogger.verbose('[counter-cleanup] Starting cleanup');
      try {
        await cleanFiles();
        appLogger.info('[counter-cleanup] Cleaned');
      } catch (e) {
        const message = e?.response?.data?.content?.message || e.message;
        appLogger.error(`[counter-cleanup] Failed to clean: ${message}`);
      }
    },
  });

  job.start();
}

module.exports = {
  getSushiURL,
  getReportDownloadConfig,
  validateReport,
  getReportFilename,
  getSushiDirectory,
  getReportPath,
  getReportTmpPath,
  getAvailableReports,
  getStatus,
  downloadReport,
  getOngoingDownload,
  initiateDownload,
  getExceptions,
  getExceptionSeverity,
  stringifyException,
  hasReportItems,
  startCleanCron,
  DEFAULT_REPORT_TYPE,
  REPORT_IDS,
  SUSHI_CODES,
  ERROR_CODES,
};

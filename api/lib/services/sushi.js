const config = require('config');
const axios = require('axios');
const path = require('path');
const fs = require('fs-extra');

const Ajv = require('ajv').default;
const addFormats = require('ajv-formats').default;
const definitions = require('../utils/sushi-definitions.json');
const { appLogger } = require('../../server');


const storageDir = config.get('storage.path');
const tmpDir = '/tmp/sushi';

const ajv = new Ajv({ schemas: [definitions], strict: false });
addFormats(ajv);
const validateReport = ajv.getSchema('#/definitions/COUNTER_title_report');

// https://app.swaggerhub.com/apis/COUNTER/counter-sushi_5_0_api/

async function getReport(endpointUrl, opts) {
  if (typeof endpointUrl !== 'string') {
    throw new TypeError('baseUrl should be a string');
  }

  const baseUrl = endpointUrl.trim().replace(/\/+$/, '');

  const options = opts || {};
  const params = typeof options.params === 'object' ? options.params : {};

  if (options.requestorId) { params.requestor_id = options.requestorId; }
  if (options.customerId) { params.customer_id = options.customerId; }
  if (options.apiKey) { params.api_key = options.apiKey; }

  if (options.beginDate && options.endDate) {
    params.begin_date = options.beginDate;
    params.end_date = options.endDate;
  }

  params.Attributes_To_Show = 'Access_Type|Access_Method|Section_Type|Data_Type|YOP';
  params.Access_Type = 'Controlled|OA_Gold';
  params.Section_Type = 'Article|Book|Chapter|Other|Section';

  return axios({
    method: 'get',
    url: `${baseUrl}/reports/tr`,
    responseType: options.stream ? 'stream' : 'json',
    params,
  });
}

function getReportFilename(options) {
  const {
    sushi,
    beginDate,
    endDate,
  } = options;

  return `${sushi.getPackage()}_${beginDate}_${endDate}.json`;
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

  if (await fs.pathExists(tmpPath)) {
    const err = new Error('Temporary file already exist');
    err.code = 'E_TMP_FILE_EXISTS';
    throw err;
  }

  await fs.ensureDir(path.dirname(reportPath));
  await fs.ensureFile(tmpPath);

  function unlinkTmpFile() {
    fs.unlink(tmpPath).catch((err) => {
      appLogger.error(`Failed to delete ${tmpPath}: ${err.message}`);
    });
  }

  const response = await sushi.getReport({ ...options, stream: true });

  if (!response) {
    unlinkTmpFile();
    throw new Error('sushi endpoint didn\'t respond');
  }
  if (response.status !== 200) {
    unlinkTmpFile();
    throw new Error(`sushi endpoint responded with status ${response.status}`);
  }
  if (!response.data) {
    unlinkTmpFile();
    throw new Error('sushi endpoint didn\'t return any data');
  }

  try {
    await new Promise((resolve, reject) => {
      response.data.pipe(fs.createWriteStream(tmpPath))
        .on('finish', resolve)
        .on('error', reject);
    });

    await fs.move(tmpPath, reportPath);
  } catch (e) {
    unlinkTmpFile();
    throw e;
  }
}

    return { valid, errors };
  },

  getExceptions(report) {
    if (!report || !report.Report_Header) { return []; }

    const header = report.Report_Header;
    const exceptions = Array.isArray(header.Exceptions) ? header.Exceptions : [];

    if (header.Exception) {
      exceptions.push(header.Exception);
    }

    return exceptions;
module.exports = {
  getReport,
  getReportFilename,
  getReportPath,
  getReportTmpPath,
  downloadReport,
};

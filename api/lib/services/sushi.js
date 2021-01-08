const axios = require('axios');
const Ajv = require('ajv').default;
const addFormats = require('ajv-formats').default;
const definitions = require('../utils/sushi-definitions.json');

const ajv = new Ajv({ schemas: [definitions], strict: false });
addFormats(ajv);
const validateReport = ajv.getSchema('#/definitions/COUNTER_title_report');

// https://app.swaggerhub.com/apis/COUNTER/counter-sushi_5_0_api/

module.exports = {
  async getReport(endpointUrl, opts) {
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
      params,
    });
  },

  validateReport(report) {
    const valid = validateReport(report);
    const { errors } = validateReport;

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
  },
};

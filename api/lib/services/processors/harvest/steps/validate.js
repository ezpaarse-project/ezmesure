// @ts-check

const sushiService = require('../../../sushi');

const HarvestError = require('../HarvestError');

const { ERROR_CODES } = sushiService;

/**
 * Download SUSHI report and check for exceptions
 *
 * @param {import('..').ProcessorStepParam} params
 */
module.exports = async function process(params) {
  const {
    task: {
      data: task,
      save: saveTask,
      steps,
      logs,
    },
    timeout,
    data: { report },
  } = params;

  const { ignoreValidation } = task.session;
  let { ignoreReportValidation } = task.credentials.endpoint;
  if (typeof ignoreValidation === 'boolean') {
    ignoreReportValidation = ignoreValidation;
  }

  const validationStep = await steps.create('validation');
  await saveTask();
  logs.add('info', 'Validating COUNTER report');
  timeout.reset();

  const {
    valid,
    errors,
    reportId: foundReportId,
    unsupported,
    version: foundVersion,
  } = sushiService.validateReport(report);
  timeout.reset();

  if (foundReportId) {
    logs.add('info', `Report_ID is [${foundReportId}]`);
  } else {
    logs.add('error', 'Report_ID is missing from the report header');
  }

  if (foundVersion) {
    logs.add('info', `Release is [${foundVersion}]`);
  } else {
    logs.add('error', 'Release is missing from the report header');
  }

  if (foundVersion !== task.counterVersion) {
    logs.add('error', `Report version is [${foundVersion}]`);
    if (task.counterVersion) {
      logs.add('error', `Expected version is [${task.counterVersion}]`);
    }

    if (!ignoreReportValidation) {
      throw new HarvestError('The report is not in the expected version');
    } else {
      logs.add('info', 'Ignoring report validation check');
    }
  }

  if (!valid) {
    if (unsupported) {
      logs.add('error', 'Unsupported report type');
    }
    if (Array.isArray(errors)) {
      // @ts-ignore
      errors.slice(0, 10).forEach((e) => {
        logs.add('error', `${e.message} at ${e.instancePath}`);
      });
      timeout.reset();
    }

    if (!ignoreReportValidation) {
      task.errorCode = ERROR_CODES.invalidReport;
      throw new HarvestError('The report is not valid');
    } else {
      logs.add('info', 'Ignoring report validation');
    }
  }

  await steps.end(validationStep);

  // eslint-disable-next-line no-param-reassign
  params.data.reportId = foundReportId;
  // eslint-disable-next-line no-param-reassign
  params.data.version = foundVersion;
};

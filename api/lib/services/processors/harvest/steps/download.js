// @ts-check

const fs = require('fs-extra');

const sushiService = require('../../../sushi');

const HarvestError = require('../HarvestError');

/* eslint-disable max-len */
/**
 * @typedef {import('../../../../entities/institutions.service').Institution} Institution
 * @typedef {import('../../../../entities/sushi-endpoints.service').SushiEndpoint} SushiEndpoint
 * @typedef {import('../../../../entities/sushi-credentials.service').SushiCredentials} SushiCredentials
 * @typedef {import('../../../../entities/harvest-session.service').HarvestSession} HarvestSession
 * @typedef {import('../../../../entities/harvest-job.service').HarvestJob} HarvestJob
 * @typedef {import('bullmq').Job} Job
 * @typedef {import('bullmq').Processor} Processor
*
* @typedef {SushiCredentials & { endpoint: SushiEndpoint, institution: Institution }} HarvestedCredentials
* @typedef {HarvestJob & { session: HarvestSession, credentials: HarvestedCredentials }} JobTask
*/
/* eslint-enable max-len */

const { SUSHI_CODES, ERROR_CODES } = sushiService;

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
  } = params;

  const {
    session: {
      beginDate,
      endDate,
      forceDownload,
    },
    credentials,
    reportType = sushiService.DEFAULT_REPORT_TYPE,
  } = task;

  const {
    endpoint,
    institution,
  } = credentials;

  const sushiData = {
    reportType,
    sushi: credentials,
    endpoint,
    institution,
    beginDate,
    endDate,
  };

  const reportPath = sushiService.getReportPath(sushiData);
  let report;
  let reportContent;

  const downloadStep = await steps.create('download');
  await saveTask();
  timeout.reset();

  try {
    reportContent = await fs.readFile(reportPath, 'utf8');
    timeout.reset();
  } catch (e) {
    if (e.code !== 'ENOENT') {
      task.errorCode = ERROR_CODES.unreadableReport;
      throw new HarvestError('Failed to read report file', { cause: e });
    }
  }

  if (reportContent) {
    logs.add('info', 'A local copy of the COUNTER report is already present');

    try {
      report = JSON.parse(reportContent);
      timeout.reset();
    } catch (e) {
      logs.add('warning', 'The report is not a valid JSON, it will be re-downloaded');
    }

    const exceptions = sushiService.getExceptions(report);
    timeout.reset();

    const hasFatalException = exceptions.some((e) => {
      const severity = sushiService.getExceptionSeverity(e);
      return ['error', 'fatal'].includes(severity);
    });
    timeout.reset();

    if (hasFatalException) {
      logs.add('warning', 'The report contains fatal exceptions, it will be re-downloaded');
      report = null;
    }

    const wasDelayed = exceptions.some((e) => e?.Code === SUSHI_CODES.queuedForProcessing);
    timeout.reset();

    if (wasDelayed) {
      logs.add('info', 'The report was delayed, it will be re-downloaded');
      report = null;
    }

    const hasItems = sushiService.hasReportItems(report);
    timeout.reset();

    if (!hasItems) {
      logs.add('info', 'The report does not contain items, it will be re-downloaded');
      report = null;
    }
  }

  if (!report || forceDownload) {
    try {
      await fs.remove(reportPath);
      timeout.reset();
    } catch (e) {
      throw new HarvestError('Failed to delete the local copy of the report', { cause: e });
    }

    let deferred = false;

    try {
      let download = sushiService.getOngoingDownload(sushiData);
      timeout.reset();

      if (download) {
        logs.add('info', 'Report is already being downloaded, waiting for completion');
      } else {
        logs.add('info', 'Report download initiated, waiting for completion');
        download = sushiService.initiateDownload(sushiData);
        timeout.reset();
      }

      // @ts-ignore
      downloadStep.data.url = download?.getUri?.({ obfuscate: true });
      timeout.reset();

      // We must not wait for the task to be saved, otherwise the download
      // may be finished before we register listeners.
      await Promise.all([
        saveTask(),

        new Promise((resolve, reject) => {
          download.on('error', reject);
          download.on('finish', (response) => {
            logs.add('info', 'Download complete');

            const contentType = /^\s*([^;\s]*)/.exec(response?.headers?.['content-type'])?.[1];

            // @ts-ignore
            downloadStep.data.statusCode = response?.status;

            if (response?.status === 202) {
              logs.add('warning', `Endpoint responded with status [${response?.status}]`);
              deferred = true;
              // @ts-ignore
              resolve();
              return;
            }

            if (response?.status !== 200) {
              logs.add('error', `Endpoint responded with status [${response?.status}]`);
            }

            if (contentType !== 'application/json') {
              logs.add('error', `Endpoint responded with [${contentType}] instead of [application/json]`);
            }

            // @ts-ignore
            resolve();
          });
        }),
      ]);

      // TODO: emit event while download is in progress
      timeout.reset();
    } catch (e) {
      throw new HarvestError('Failed to download the COUNTER report', { cause: e });
    }

    if (deferred) {
      throw new HarvestError('Report download has been deferred', { type: 'delayed' });
    }

    try {
      report = JSON.parse(await fs.readFile(reportPath, 'utf8'));
      timeout.reset();
    } catch (e) {
      if (e instanceof SyntaxError) {
        task.errorCode = ERROR_CODES.invalidJson;
        throw new HarvestError('The report is not a valid JSON');
      } else {
        task.errorCode = ERROR_CODES.unreadableReport;
        throw new HarvestError('Fail to read downloaded report file', { cause: e });
      }
    }
  }

  const exceptions = sushiService.getExceptions(report);
  timeout.reset();

  if (exceptions.length > 0) {
    let hasError = false;
    let isDelayed = false;
    let endpointIsBusy = false;

    task.sushiExceptions = [];

    exceptions.forEach((e) => {
      const prefix = e?.Code ? `[Exception #${e.Code}]` : '[Exception]';
      const message = `${prefix} ${e?.Message}`;
      const severity = sushiService.getExceptionSeverity(e);
      const code = Number.parseInt(`${e?.Code}`, 10);

      task.sushiExceptions.push({ code, severity, message: e?.Message });

      switch (code) {
        case SUSHI_CODES.serviceBusy:
          logs.add('warning', 'Endpoint is too busy to respond');
          endpointIsBusy = true;
          break;
        case SUSHI_CODES.tooManyRequests:
          logs.add('warning', 'Too many requests to the endpoint');
          endpointIsBusy = true;
          break;
        case SUSHI_CODES.serviceUnavailable:
          logs.add('warning', 'Endpoint is unavailable');
          endpointIsBusy = true;
          break;
        case SUSHI_CODES.queuedForProcessing:
          logs.add('info', 'Report has been queued for processing');
          isDelayed = true;
          break;
        default:
      }

      switch (severity) {
        case 'fatal':
        case 'error':
          hasError = true;
          // @ts-ignore
          downloadStep.data.sushiErrorCode = code;
          task.errorCode = `sushi:${code}`;
          logs.add('error', message);
          break;
        case 'debug':
          logs.add('verbose', message);
          break;
        case 'info':
          logs.add('info', message);
          break;
        case 'warning':
        default:
          logs.add('warning', message);
      }

      if (e?.Data) { logs.add('info', `[Add. data] ${e.Data}`); }
      if (e?.Help_URL) { logs.add('info', `[Help URL] ${e.Help_URL}`); }
    });
    timeout.reset();

    await saveTask();

    if (endpointIsBusy) {
      throw new HarvestError('Endpoint is busy', { type: 'busy' });
    }
    if (isDelayed) {
      logs.add('warning', 'Endpoint has queued report for processing');
      throw new HarvestError('Report download has been delayed', { type: 'delayed' });
    }
    if (hasError) {
      throw new HarvestError('The report contains exceptions');
    }
  }

  await steps.end(downloadStep);

  // eslint-disable-next-line no-param-reassign
  params.data.report = report;
};

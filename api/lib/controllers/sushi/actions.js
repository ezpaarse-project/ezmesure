const fs = require('fs-extra');
const path = require('path');
const format = require('date-fns/format');
const isBefore = require('date-fns/isBefore');
const subMonths = require('date-fns/subMonths');
const parseISO = require('date-fns/parseISO');
const isValidDate = require('date-fns/isValid');
const { v4: uuidv4 } = require('uuid');
const send = require('koa-send');
const config = require('config');

const sushiService = require('../../services/sushi');
const { appLogger } = require('../../services/logger');
const { harvestQueue } = require('../../services/jobs');

const { SUSHI_CODES, ERROR_CODES } = sushiService;

const repositoriesService = require('../../entities/repositories.service');
const sushiCredentialsService = require('../../entities/sushi-credentials.service');
const harvestJobsService = require('../../entities/harvest-job.service');
const harvestsService = require('../../entities/harvest.service');
const SushiEndpointsService = require('../../entities/sushi-endpoint.service');

const DEFAULT_HARVESTED_REPORTS = new Set(config.get('counter.defaultHarvestedReports'));

/* eslint-disable max-len */
/**
 * @typedef {import('@prisma/client').Prisma.HarvestFindManyArgs} HarvestFindManyArgs
 * @typedef {import('@prisma/client').Prisma.SushiCredentialsFindManyArgs} SushiCredentialsFindManyArgs
 */
/* eslint-enable max-len */

exports.getAll = async (ctx) => {
  const {
    id: sushiIds,
    institutionId,
    endpointId,
    include: propsToInclude,
    q: query,
    size,
    sort,
    order = 'asc',
    page = 1,
  } = ctx.query;

  let include;

  if (ctx.state?.user?.isAdmin && Array.isArray(propsToInclude)) {
    include = Object.fromEntries(propsToInclude.map((prop) => [prop, true]));
  }

  /** @type {SushiCredentialsFindManyArgs} */
  const options = {
    include,
    take: Number.isInteger(size) ? size : undefined,
    skip: Number.isInteger(size) ? size * (page - 1) : undefined,
    where: {},
  };

  if (sort) {
    options.orderBy = { [sort]: order };
  }

  if (query) {
    options.where = {
      OR: [
        { endpoint: { vendor: { contains: query, mode: 'insensitive' } } },
        { institution: { name: { contains: query, mode: 'insensitive' } } },
      ],
    };
  }

  if (sushiIds) {
    options.where.id = Array.isArray(sushiIds)
      ? { in: sushiIds }
      : { equals: sushiIds };
  }
  if (institutionId) {
    options.where.institutionId = Array.isArray(institutionId)
      ? { in: institutionId }
      : { equals: institutionId };
  }
  if (endpointId) {
    options.where.endpointId = Array.isArray(endpointId)
      ? { in: endpointId }
      : { equals: endpointId };
  }

  ctx.type = 'json';
  ctx.status = 200;
  ctx.body = await sushiCredentialsService.findMany(options);
};

exports.getOne = async (ctx) => {
  const { sushi } = ctx.state;

  ctx.status = 200;
  ctx.body = sushi;
};

exports.getTasks = async (ctx) => {
  const { sushi } = ctx.state;

  ctx.status = 200;
  ctx.body = await harvestJobsService.findMany({ where: { credentialsId: sushi.id } });
};

exports.addSushi = async (ctx) => {
  ctx.action = 'sushi/create';
  const { body: sushiData } = ctx.request;
  const { institution } = ctx.state;

  ctx.metadata = {
    vendor: sushiData.vendor,
    institutionId: institution.id,
    institutionName: institution.name,
  };

  const sushiItem = await sushiCredentialsService.create({
    data: {
      ...sushiData,
      endpoint: { connect: { id: sushiData?.endpointId } },
      institution: { connect: { id: sushiData?.institutionId } },
      endpointId: undefined,
      institutionId: undefined,
    },
  });

  ctx.metadata.sushiId = sushiItem?.id;
  ctx.status = 201;
  ctx.body = sushiItem;
};

exports.updateSushi = async (ctx) => {
  ctx.action = 'sushi/update';
  const { sushi, institution } = ctx.state;
  const { body } = ctx.request;

  ctx.metadata = {
    sushiId: sushi.id,
    vendor: sushi.endpoint?.vendor,
    institutionId: institution.id,
    institutionName: institution.name,
  };

  const updatedSushiCredentials = await sushiCredentialsService.update({
    where: { id: sushi.id },
    data: body,
  });

  ctx.status = 200;
  ctx.body = updatedSushiCredentials;
};

exports.deleteOne = async (ctx) => {
  ctx.action = 'sushi/delete';
  const { sushi } = ctx.state;

  ctx.metadata = {
    sushiId: sushi?.id,
    endpointVendor: sushi?.endpoint?.vendor,
  };

  await sushiCredentialsService.delete({ where: { id: sushi?.id } });

  ctx.status = 204;
};

exports.getHarvests = async (ctx) => {
  const { sushiId } = ctx.params;
  const {
    from,
    to,
    reportId,
    size,
    sort,
    order = 'asc',
    page = 1,
  } = ctx.request.query;

  /** @type {HarvestFindManyArgs} */
  const options = {
    take: Number.isInteger(size) ? size : undefined,
    skip: Number.isInteger(size) ? size * (page - 1) : undefined,
    orderBy: sort ? { [sort]: order } : undefined,
    where: {
      credentialsId: sushiId,
      reportId,
    },
  };

  if (from || to) {
    options.where.period = { gte: from, lte: to };
  }

  const harvests = await harvestsService.findMany(options);

  ctx.type = 'json';
  ctx.status = 200;
  ctx.body = harvests;
};

exports.getAvailableReports = async (ctx) => {
  const { sushi } = ctx.state;

  let data;
  let headers;
  let exceptions;

  try {
    ({ data, headers } = await sushiService.getAvailableReports(sushi));
  } catch (e) {
    exceptions = sushiService.getExceptions(e?.response?.data);

    if (!Array.isArray(exceptions) || exceptions.length === 0) {
      ctx.throw(502, e);
    }
  }

  if (!Array.isArray(exceptions) || exceptions.length === 0) {
    exceptions = sushiService.getExceptions(data);
  }

  if (exceptions.length > 0) {
    ctx.status = 502;
    ctx.body = { exceptions };
    return;
  }

  const isValidReport = (report) => (report.Report_ID && report.Report_Name);

  if (!Array.isArray(data) || !data.every(isValidReport)) {
    const contentType = /^\s*([^;\s]*)/.exec(headers['content-type'])?.[1];

    if (contentType === 'application/json') {
      ctx.throw(502, ctx.$t('errors.sushi.invalidResponse'), { expose: true });
    } else {
      ctx.throw(502, ctx.$t('errors.sushi.notJsonResponse', contentType), { expose: true });
    }
  }

  ctx.status = 200;
  ctx.body = data;
};

exports.downloadReport = async (ctx) => {
  ctx.action = 'sushi/download-report';
  const { query = {} } = ctx.request;
  const { sushi, institution, endpoint } = ctx.state;
  let { beginDate, endDate } = query;

  ctx.metadata = {
    sushiId: sushi.id,
    vendor: endpoint.vendor,
    institutionId: institution.id,
    institutionName: institution.name,
  };

  if (!beginDate && !endDate) {
    const prevMonth = format(subMonths(new Date(), 1), 'yyyy-MM');
    beginDate = prevMonth;
    endDate = prevMonth;
  } else if (!beginDate) {
    beginDate = endDate;
  } else if (!endDate) {
    endDate = beginDate;
  }

  const sushiData = {
    endpoint,
    sushi,
    institution,
    beginDate,
    endDate,
  };
  const reportPath = sushiService.getReportPath(sushiData);

  if (await fs.pathExists(reportPath)) {
    ctx.status = 200;
    ctx.body = fs.createReadStream(reportPath);
    return;
  }

  let message;

  if (sushiService.getOngoingDownload(sushiData)) {
    message = 'download is in progress, please retry this link later';
  } else {
    message = 'download initiated, please retry this link later';

    sushiService.initiateDownload(sushiData)
      .on('finish', (response, filePath) => {
        appLogger.info(`Report downloaded at ${filePath}`);
      })
      .on('error', (err) => {
        appLogger.error(`Failed to download report ${reportPath}: ${err.message}`);
      });
  }

  ctx.set('Retry-After', 10);
  ctx.status = 202;
  ctx.body = { message };
};

exports.getFileList = async (ctx) => {
  const { sushi, institution } = ctx.state;

  const sushiDir = sushiService.getSushiDirectory({ sushi, institution });
  let rootFiles;

  try {
    rootFiles = await fs.readdir(sushiDir, { withFileTypes: true });
  } catch (e) {
    if (e.code !== 'ENOENT') { throw e; }
    rootFiles = [];
  }

  const readFile = async (root, parentDirPath, filename) => {
    const filePath = path.resolve(root, parentDirPath, filename);
    const stat = await fs.stat(filePath);

    if (stat.isFile()) {
      return {
        name: filename,
        type: 'file',
        size: stat.size,
        mtime: stat.mtime,
        href: `/api/sushi/${sushi.id}/files/${parentDirPath}/${filename}`,
      };
    }

    const children = await fs.readdir(filePath, { withFileTypes: true });

    return {
      name: filename,
      type: 'directory',
      size: stat.size,
      mtime: stat.mtime,
      children: await Promise.all(
        children
          .filter((file) => file.isFile() || file.isDirectory())
          .map((file) => readFile(root, path.join(parentDirPath, filename), file.name)),
      ),
    };
  };

  ctx.status = 200;
  ctx.type = 'json';
  ctx.body = await Promise.all(
    rootFiles
      .filter((file) => file.isFile() || file.isDirectory())
      .map((file) => readFile(path.resolve(sushiDir), '.', file.name)),
  );
};

exports.downloadFile = async (ctx) => {
  const { sushi, institution } = ctx.state;
  const { filePath } = ctx.params;

  await send(ctx, filePath, {
    root: sushiService.getSushiDirectory({ sushi, institution }),
  });
};

exports.harvestSushi = async (ctx) => {
  ctx.action = 'sushi/harvest';
  const { body = {} } = ctx.request;
  const {
    target,
    forceDownload,
    ignoreValidation,
    harvestId = uuidv4(),
    timeout,
  } = body;

  let {
    reportType: reportTypes,
  } = body;

  const { sushi } = ctx.state;
  const { endpoint, institution } = sushi;

  let index = target;

  if (!index) {
    const repository = await repositoriesService.findFirst({
      where: {
        institutionId: institution.id,
        type: 'counter5',
      },
    });

    if (!repository?.pattern) {
      ctx.throw(400, ctx.$t('errors.harvest.noTarget', institution.id));
    }

    index = repository.pattern.replace(/[*]/g, '');
  }

  ctx.metadata = {
    sushiId: sushi.id,
    vendor: endpoint.vendor,
    institutionId: institution.id,
    institutionName: institution.name,
    reportTypes,
  };

  const supportedReportsUpdatedAt = endpoint?.supportedReportsUpdatedAt;
  const oneMonthAgo = subMonths(new Date(), 1);

  if (!isValidDate(supportedReportsUpdatedAt) || isBefore(supportedReportsUpdatedAt, oneMonthAgo)) {
    appLogger.verbose(`Updating supported SUSHI reports of [${endpoint?.vendor}]`);

    const isValidReport = (report) => (report.Report_ID && report.Report_Name);
    let supportedReports;

    try {
      const { data } = await sushiService.getAvailableReports(sushi);

      if (!Array.isArray(data) || !data.every(isValidReport)) {
        throw new Error('invalid response body');
      }

      supportedReports = data.map((report) => report.Report_ID.toLowerCase());
    } catch (e) {
      appLogger.warn(`Failed to update supported reports of [${endpoint.vendor}] (Reason: ${e.message})`);
    }

    sushi.endpoint = await SushiEndpointsService.update({
      where: { id: sushi?.endpoint?.id },
      data: {
        supportedReports,
        supportedReportsUpdatedAt: new Date(),
      },
    });
  }

  if (reportTypes.includes('all')) {
    const { supportedReports = [] } = sushi.endpoint;

    if (supportedReports.length === 0) {
      reportTypes = Array.from(DEFAULT_HARVESTED_REPORTS);
    } else {
      reportTypes = Array.from(
        new Set(supportedReports.filter((reportId) => DEFAULT_HARVESTED_REPORTS.has(reportId))),
      );
    }
  }

  /** @type {Date} */
  let beginDate = body.beginDate && parseISO(body.beginDate, 'yyyy-MM');
  /** @type {Date} */
  let endDate = body.endDate && parseISO(body.endDate, 'yyyy-MM');

  if (beginDate && !isValidDate(beginDate)) {
    ctx.throw(400, ctx.$t('errors.harvest.invalidDate', body.beginDate));
  }
  if (endDate && !isValidDate(endDate)) {
    ctx.throw(400, ctx.$t('errors.harvest.invalidDate', body.endDate));
  }
  if (beginDate && endDate && isBefore(endDate, beginDate)) {
    ctx.throw(400, ctx.$t('errors.harvest.invalidPeriod', body.beginDate, body.endDate));
  }

  if (!beginDate && !endDate) {
    /** @type {Date} */
    const prevMonth = subMonths(new Date(), 1);
    beginDate = prevMonth;
    endDate = prevMonth;
  } else if (!beginDate) {
    beginDate = endDate;
  } else if (!endDate) {
    endDate = beginDate;
  }

  ctx.type = 'json';
  ctx.body = await Promise.all(
    reportTypes.flatMap(
      async (reportType) => {
        const task = await harvestJobsService.create({
          include: {
            credentials: {
              include: {
                endpoint: true,
              },
            },
          },
          data: {
            credentials: {
              connect: { id: sushi.id },
            },
            status: 'waiting',
            harvestId,
            timeout,
            reportType,
            index,
            beginDate: format(beginDate, 'yyyy-MM'),
            endDate: format(endDate, 'yyyy-MM'),
            forceDownload,
            ignoreValidation,
          },
        });

        await harvestQueue.add(
          'harvest',
          { taskId: task.id, timeout },
          { jobId: task.id },
        );

        return task;
      },
    ),
  );
};

exports.checkSushiConnection = async (ctx) => {
  ctx.action = 'sushi/checkConnection';
  ctx.type = 'json';

  const { sushi } = ctx.state;
  const { endpoint, institution } = sushi;

  ctx.metadata = {
    sushiId: sushi.id,
    vendor: endpoint.vendor,
    institutionId: institution.id,
    institutionName: institution.name,
  };

  const twoMonthAgo = subMonths(new Date(), 2);

  /** @type {Date} */
  const endDate = twoMonthAgo;
  /** @type {Date} */
  const beginDate = subMonths(endDate, 1);

  const sushiData = {
    sushi,
    institution,
    endpoint,
    beginDate,
    endDate,
    reportType: 'pr',
  };

  const reportPath = sushiService.getReportPath(sushiData);

  const download = (
    sushiService.getOngoingDownload(sushiData) || sushiService.initiateDownload(sushiData)
  );

  /** @type {import('axios').AxiosResponse} */
  let response;
  let report;
  let errorCode;

  try {
    response = await new Promise((resolve, reject) => {
      download.on('error', reject);
      download.on('finish', (res) => { resolve(res); });
    });
  } catch (e) {
    errorCode = ERROR_CODES.networkError;
  }

  try {
    report = JSON.parse(await fs.readFile(reportPath, 'utf8'));
  } catch (e) {
    if (e instanceof SyntaxError) {
      errorCode = ERROR_CODES.invalidJson;
    } else {
      errorCode = ERROR_CODES.unreadableReport;
    }
  }

  if (response?.status === 401) {
    errorCode = ERROR_CODES.unauthorized;
  }

  const exceptions = sushiService.getExceptions(report);

  exceptions?.forEach?.((e) => {
    switch (e.Code) {
      case SUSHI_CODES.insufficientInformation:
      case SUSHI_CODES.unauthorizedRequestor:
      case SUSHI_CODES.unauthorizedRequestorAlt:
      case SUSHI_CODES.invalidAPIKey:
      case SUSHI_CODES.unauthorizedIPAddress:
        errorCode = `sushi:${e.Code}`;
        break;
      default:
    }
  });

  ctx.body = await sushiCredentialsService.update({
    where: { id: sushi.id },
    data: {
      connection: {
        date: Date.now(),
        success: !errorCode,
        exceptions: exceptions || null,
        errorCode: errorCode || null,
      },
    },
  });
};

exports.importSushiItems = async (ctx) => {
  ctx.action = 'sushi/import';
  const { body = [] } = ctx.request;
  const { overwrite } = ctx.query;
  const { institution } = ctx.state;
  const institutionId = institution.id;

  ctx.metadata = {
    institutionId,
    institutionName: institution.name,
  };

  const response = {
    errors: 0,
    conflicts: 0,
    created: 0,
    items: [],
  };

  const addResponseItem = (data, status, message) => {
    if (status === 'error') { response.errors += 1; }
    if (status === 'conflict') { response.conflicts += 1; }
    if (status === 'created') { response.created += 1; }

    response.items.push({
      status,
      message,
      data,
    });
  };

  const importItem = async (data = {}) => {
    if (data.id) {
      const sushiItem = await sushiCredentialsService.findUnique({ where: { id: data.id } });

      if (sushiItem && sushiItem.institutionId !== institutionId) {
        addResponseItem(sushiItem, 'error', ctx.$t('errors.sushi.import.belongsToAnother', sushiItem.id));
        return;
      }

      if (sushiItem && !overwrite) {
        addResponseItem(sushiItem, 'conflict', ctx.$t('errors.sushi.import.alreadyExists', sushiItem.id));
        return;
      }
    }

    const sushiData = {
      ...data,
      endpoint: { connect: { id: data?.endpointId } },
      institution: { connect: { id: institutionId } },
      endpointId: undefined,
      institutionId: undefined,
    };

    const sushiItem = await sushiCredentialsService.upsert({
      where: { id: sushiData.id },
      create: sushiData,
      update: sushiData,
    });

    addResponseItem(sushiItem, 'created');
  };

  for (let i = 0; i < body.length; i += 1) {
    const sushiData = body[i] || {};

    try {
      await importItem(sushiData); // eslint-disable-line no-await-in-loop
    } catch (e) {
      addResponseItem(sushiData, 'error', e.message);
    }
  }

  ctx.type = 'json';
  ctx.body = response;
};

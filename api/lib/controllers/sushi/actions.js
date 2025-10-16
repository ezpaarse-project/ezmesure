const { setTimeout } = require('node:timers/promises');

const fs = require('fs-extra');
const path = require('path');
const send = require('koa-send');
const { v4: uuidv4 } = require('uuid');
const {
  format,
  formatISO,
  subMonths,
} = require('date-fns');

const sushiService = require('../../services/sushi');
const { appLogger } = require('../../services/logger');

const { SUSHI_CODES, ERROR_CODES } = sushiService;

const ActionsService = require('../../entities/actions.service');
const SushiCredentialsService = require('../../entities/sushi-credentials.service');
const HarvestJobsService = require('../../entities/harvest-job.service');
const HarvestsService = require('../../entities/harvest.service');
const HarvestSessionService = require('../../entities/harvest-session.service');
const SushiEndpointsService = require('../../entities/sushi-endpoints.service');

const { schema, includableFields } = require('../../entities/sushi-credentials.dto');

/* eslint-disable max-len */
/**
 * @typedef {import('@prisma/client').Prisma.HarvestFindManyArgs} HarvestFindManyArgs
 * @typedef {import('@prisma/client').Prisma.SushiCredentialsFindManyArgs} SushiCredentialsFindManyArgs
 */
/* eslint-enable max-len */

const { propsToPrismaInclude } = require('../../services/std-query/prisma-query');
const { prepareStandardQueryParams } = require('../../services/std-query');

const standardQueryParams = prepareStandardQueryParams({
  schema,
  includableFields,
  queryFields: [],
});
exports.standardQueryParams = standardQueryParams;

exports.getAll = async (ctx) => {
  const { connection, q: query } = ctx.query;

  const prismaQuery = standardQueryParams.getPrismaManyQuery(ctx);
  if (!ctx.state?.user?.isAdmin) {
    prismaQuery.include = undefined;
  }

  if (query) {
    prismaQuery.where = {
      ...prismaQuery.where,
      OR: [
        { endpoint: { vendor: { contains: query, mode: 'insensitive' } } },
        { institution: { name: { contains: query, mode: 'insensitive' } } },
        { institution: { acronym: { contains: query, mode: 'insensitive' } } },
      ],
    };
  }

  switch (connection) {
    case 'working':
    case 'success':
      prismaQuery.where.connection = { path: ['status'], equals: 'success' };
      break;
    case 'unauthorized':
      prismaQuery.where.connection = { path: ['status'], equals: 'unauthorized' };
      break;
    case 'failed':
    case 'faulty':
      prismaQuery.where.connection = { path: ['status'], equals: 'failed' };
      break;
    case 'untested':
      prismaQuery.where.connection = { equals: {} };
      break;

    default:
      break;
  }

  const sushiCredentialsService = new SushiCredentialsService();

  ctx.type = 'json';
  ctx.status = 200;
  ctx.set('X-Total-Count', await sushiCredentialsService.count({ where: prismaQuery.where }));
  ctx.body = await sushiCredentialsService.findMany(prismaQuery);
};

exports.getOne = async (ctx) => {
  const { sushiId } = ctx.params;

  const prismaQuery = standardQueryParams.getPrismaOneQuery(ctx, { id: sushiId });
  if (!ctx.state?.user?.isAdmin) {
    prismaQuery.include = undefined;
  }

  const sushiCredentialsService = new SushiCredentialsService();
  const sushi = await sushiCredentialsService.findUnique(prismaQuery);

  if (!sushi) {
    ctx.throw(404, ctx.$t('errors.sushi.notFound'));
    return;
  }

  ctx.status = 200;
  ctx.body = sushi;
};

exports.getTasks = async (ctx) => {
  const { sushi } = ctx.state;

  const harvestJobsService = new HarvestJobsService();

  ctx.status = 200;
  ctx.body = await harvestJobsService.findMany({ where: { credentialsId: sushi.id } });
};

exports.addSushi = async (ctx) => {
  const { institution, endpoint } = ctx.state;
  const { update, force } = ctx.query;
  const { body: data } = ctx.request;

  const credentialsService = new SushiCredentialsService();

  // Don't check for similar credentials if there's custom params
  if (!force && (!Array.isArray(data.params) || data.params.length <= 0)) {
    const similar = await credentialsService.findSimilar(
      { ...data, endpoint },
      { institutionId: institution.id },
    );

    if (similar) {
      // If similar and we shouldn't do the update, throw an error
      if (!update) {
        ctx.status = 409;
        // Makes it look like an error, but add sushi found
        // (somehow attaching it with ctx.throw didn't work)
        ctx.body = {
          status: 409,
          error: ctx.$t('errors.sushi.similar'),
          similar,
        };
        return;
      }

      // Update the credentials found with new data
      ctx.status = 200;
      ctx.body = await SushiCredentialsService.$transaction(async (service) => {
        const actionService = new ActionsService(service);

        // Force active and archived state to be reset
        data.active = true;
        data.archived = false;

        if (similar.active !== data.active) {
          data.activeUpdatedAt = new Date();
        }
        if (similar.archived !== data.archived) {
          data.archivedUpdatedAt = new Date();
        }

        const sushi = await service.update({
          where: { id: similar.id },
          data: {
            ...data,
            endpoint: { connect: { id: endpoint.id } },
            endpointId: undefined,
            // Avoid changing institution
            institutionId: undefined,
          },
          include: { endpoint: true },
        });

        await actionService.create({
          data: {
            type: 'sushi/update',
            institution: { connect: { id: institution.id } },
            author: { connect: { username: ctx.state.user.username } },
            data: {
              vendor: endpoint.vendor,
              state: sushi,
              oldState: similar,
            },
          },
        });

        return { ...sushi, endpoint: undefined };
      });
      return;
    }
  }

  // Create new credentials
  ctx.status = 201;
  ctx.body = await SushiCredentialsService.$transaction(async (service) => {
    const actionService = new ActionsService(service);

    const sushi = await service.create({
      data: {
        ...data,
        endpoint: { connect: { id: endpoint.id } },
        endpointId: undefined,
        institution: { connect: { id: institution.id } },
        institutionId: undefined,
      },
      include: { endpoint: true },
    });

    await actionService.create({
      data: {
        type: 'sushi/create',
        institution: { connect: { id: institution.id } },
        author: { connect: { username: ctx.state.user.username } },
        data: {
          vendor: endpoint.vendor,
          state: sushi,
        },
      },
    });

    return { ...sushi, endpoint: undefined };
  });
};

exports.updateSushi = async (ctx) => {
  const { sushi, institution } = ctx.state;
  const { force } = ctx.query;
  const { body } = ctx.request;

  // Apply transformations
  const data = { ...body, connection: {} };
  if (typeof body.active === 'boolean' || typeof body.archived === 'boolean') {
    if (Object.keys(body).length === 1) {
      // If only the active state is toggled, no need to change update date
      data.updatedAt = sushi.updatedAt;
      data.connection = undefined;
    }
    if (sushi.active !== body.active) {
      data.activeUpdatedAt = new Date();
    }
    if (sushi.archived !== body.archived) {
      data.archivedUpdatedAt = new Date();
    }
  }

  const endpointsService = new SushiEndpointsService();

  const targetEndpoint = await endpointsService.findUnique({
    where: { id: data?.endpointId ?? sushi.endpointId },
  });

  let similar;

  const credentialsService = new SushiCredentialsService();

  // Don't check for similar credentials if there's custom params
  if (!force && (!Array.isArray(data.params) || data.params.length <= 0)) {
    similar = await credentialsService.findSimilar(
      { ...sushi, ...data, endpoint: targetEndpoint },
      { institutionId: institution.id },
    );

    if (similar) {
      // If similar throw an error
      ctx.status = 409;
      // Makes it look like an error, but add sushi found
      // (somehow attaching it with ctx.throw didn't work)
      ctx.body = {
        status: 409,
        error: ctx.$t('errors.sushi.similar'),
        similar,
      };
      return;
    }
  }

  // Update credentials
  ctx.status = 200;
  ctx.body = await SushiCredentialsService.$transaction(async (service) => {
    const actionService = new ActionsService(service);

    const newSushi = await service.update({
      where: { id: similar?.id ?? sushi.id },
      data: {
        ...data,
        endpoint: { connect: { id: targetEndpoint.id } },
        endpointId: undefined,
        // Avoid changing institution
        institutionId: undefined,
      },
      include: { endpoint: true },
    });

    await actionService.create({
      data: {
        type: 'sushi/update',
        institution: { connect: { id: institution.id } },
        author: { connect: { username: ctx.state.user.username } },
        data: {
          vendor: targetEndpoint.vendor,
          state: newSushi,
          oldState: similar,
        },
      },
    });

    return { ...newSushi, endpoint: undefined };
  });
};

exports.deleteOne = async (ctx) => {
  ctx.action = 'sushi/delete';
  const { sushi } = ctx.state;
  const { reason } = ctx.request.body;

  if (!sushi) {
    ctx.status = 204;
    return;
  }

  ctx.metadata = {
    sushiId: sushi.id,
    endpointVendor: sushi.endpoint?.vendor,
  };

  await SushiCredentialsService.$transaction(async (credentialsService) => {
    const actionService = new ActionsService(credentialsService);

    await credentialsService.delete({ where: { id: sushi.id } });
    await actionService.create({
      data: {
        type: 'sushi/delete',
        institution: { connect: { id: sushi.institutionId } },
        author: { connect: { username: ctx.state.user.username } },
        data: {
          reason,
          vendor: sushi.endpoint?.vendor,
          oldState: {
            ...sushi,
            institution: undefined,
            // Keep only relevant info about endpoint
            endpoint: sushi.endpoint ? {
              id: sushi.endpoint.id,
              vendor: sushi.endpoint.vendor,
              description: sushi.endpoint.description,
              technicalProvider: sushi.endpoint.technicalProvider,
              sushiUrl: sushi.endpoint.sushiUrl,
              registryId: sushi.endpoint.registryId,
              requireApiKey: sushi.endpoint.requireApiKey,
              defaultApiKey: sushi.endpoint.defaultApiKey,
              requireCustomerId: sushi.endpoint.requireCustomerId,
              defaultCustomerId: sushi.endpoint.defaultCustomerId,
              requireRequestorId: sushi.endpoint.requireRequestorId,
              defaultRequestorId: sushi.endpoint.defaultRequestorId,
              paramSeparator: sushi.endpoint.paramSeparator,
              harvestDateFormat: sushi.endpoint.harvestDateFormat,
            } : undefined,
          },
        },
      },
    });
  });

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
    include,
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
    include: propsToPrismaInclude(Array.isArray(include) ? include : [include]),
  };

  if (from || to) {
    options.where.period = { gte: from, lte: to };
  }

  const harvestsService = new HarvestsService();

  ctx.type = 'json';
  ctx.status = 200;
  ctx.body = await harvestsService.findMany(options);
};

exports.getAvailableReports = async (ctx) => {
  const { sushi } = ctx.state;
  const { endpoint } = sushi;

  const reportsPerVersion = new Map();

  // eslint-disable-next-line no-restricted-syntax
  for (const version of endpoint.counterVersions) {
    let data;
    let headers;
    let exceptions;

    try {
      // eslint-disable-next-line no-await-in-loop
      ({ data, headers } = await sushiService.getAvailableReports(sushi, version));
    } catch (e) {
      exceptions = sushiService.getExceptions(e?.response?.data);

      if (!Array.isArray(exceptions) || exceptions.length === 0) {
        reportsPerVersion.set(version, { error: e.message });
        // eslint-disable-next-line no-continue
        continue;
      }
    }

    if (!Array.isArray(exceptions) || exceptions.length === 0) {
      exceptions = sushiService.getExceptions(data);
    }

    if (exceptions.length > 0) {
      reportsPerVersion.set(version, { exceptions });
      // eslint-disable-next-line no-continue
      continue;
    }

    const isValidReport = (report) => (report.Report_ID && report.Report_Name);

    if (!Array.isArray(data) || !data.every(isValidReport)) {
      const contentType = /^\s*([^;\s]*)/.exec(headers['content-type'])?.[1];

      if (contentType === 'application/json') {
        reportsPerVersion.set(version, { error: ctx.$t('errors.sushi.invalidResponse') });
      } else {
        reportsPerVersion.set(version, { error: ctx.$t('errors.sushi.notJsonResponse', contentType) });
      }
    }

    reportsPerVersion.set(version, { data });
    // eslint-disable-next-line no-await-in-loop
    await setTimeout(1000);
  }

  ctx.status = 200;
  ctx.body = Object.fromEntries(reportsPerVersion);
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

const getCounterVersionForCheck = (endpoint, period) => {
  // Sort from most recent to oldest (6 -> 5.2 -> 5.1 -> 5 -> ...)
  const availableVersions = endpoint.counterVersions.sort((a, b) => (b > a ? 1 : -1));

  // If no version are found, return to default
  if (availableVersions <= 0) {
    return undefined;
  }

  const haveAvailability = !!endpoint.counterVersionsAvailability
    && typeof endpoint.counterVersionsAvailability === 'object'
    && !Array.isArray(endpoint.counterVersionsAvailability);

  // If availability cannot be used, assume latest version is correct
  if (!haveAvailability) {
    return availableVersions[0];
  }

  // Find suitable availability period
  return availableVersions.find((version) => {
    const firstMonthAvailable = endpoint.counterVersionsAvailability?.[version] ?? '';
    return !firstMonthAvailable
      || typeof firstMonthAvailable !== 'string'
      || HarvestSessionService.isEndAfterLimit(period, firstMonthAvailable);
  }) || availableVersions[0];
};

const checkConnection = async (sushi, params) => {
  const { endpoint } = sushi;

  const threeMonthAgo = format(subMonths(new Date(), 3), 'yyyy-MM');
  const period = {
    beginDate: params.beginDate || params.endDate || threeMonthAgo,
    endDate: params.endDate || params.beginDate || threeMonthAgo,
  };

  let { counterVersion } = params;
  if (endpoint.counterVersions && !counterVersion) {
    counterVersion = getCounterVersionForCheck(endpoint, period);
  }

  // Defaults to COUNTER 5
  if (!counterVersion) {
    counterVersion = '5';
  }

  const sushiData = {
    ...period,
    sushi,
    institution: sushi.institution,
    endpoint,
    reportType: endpoint.testedReport || 'pr',
    counterVersion,
  };

  const reportPath = sushiService.getReportPath(sushiData);

  const download = (
    sushiService.getOngoingDownload(sushiData) || sushiService.initiateDownload(sushiData)
  );

  /** @type {import('axios').AxiosResponse} */
  let response;
  /** @type {'unauthorized'|'failed'|'success'} */
  let status;
  let report;
  let errorCode;

  try {
    response = await new Promise((resolve, reject) => {
      download.on('error', reject);
      download.on('finish', (res) => { resolve(res); });
    });
  } catch {
    errorCode = ERROR_CODES.networkError;
  }

  if (!errorCode) {
    try {
      report = JSON.parse(await fs.readFile(reportPath, 'utf8'));
    } catch (e) {
      if (e instanceof SyntaxError) {
        errorCode = ERROR_CODES.invalidJson;
      } else {
        errorCode = ERROR_CODES.unreadableReport;
      }
    }
  }

  if (response?.status === 401 || response?.status === 403) {
    status = 'unauthorized';
    errorCode = ERROR_CODES.unauthorized;
  }

  const exceptions = sushiService.getExceptions(report);

  exceptions.forEach((e) => {
    switch (e.Code) {
      case SUSHI_CODES.insufficientInformation:
      case SUSHI_CODES.unauthorizedRequestor:
      case SUSHI_CODES.unauthorizedRequestorAlt:
      case SUSHI_CODES.invalidAPIKey:
      case SUSHI_CODES.unauthorizedIPAddress:
        status = 'unauthorized';
        errorCode = `sushi:${e.Code}`;
        break;
      case SUSHI_CODES.serviceUnavailable:
      case SUSHI_CODES.serviceBusy:
      case SUSHI_CODES.tooManyRequests:
        status = 'failed';
        errorCode = `sushi:${e.Code}`;
        break;
      default:
    }
  });

  if (!endpoint.ignoreReportValidation && report && exceptions?.length === 0) {
    const { valid } = sushiService.validateReport(report);

    if (!valid) {
      errorCode = ERROR_CODES.invalidReport;
    }
  }

  if (!status && !errorCode) {
    status = 'success';
  }

  return {
    date: Date.now(),
    status: status || 'failed',
    exceptions: exceptions || null,
    errorCode: errorCode || null,
    counterVersion,
  };
};

exports.validateReport = async (ctx) => {
  ctx.type = 'json';

  const { body: report } = ctx.request;

  const exceptions = sushiService.getExceptions(report);
  const validation = sushiService.validateReport(report);

  ctx.body = {
    exceptions,
    validation,
  };
};

exports.checkCredentialsConnection = async (ctx) => {
  ctx.type = 'json';

  const { endpoint, institution = {}, ...body } = ctx.request.body;

  endpoint.id = endpoint.id || 'tmp';
  if (!institution.id) {
    institution.id = 'tmp';
  }

  const connectionData = await checkConnection(
    {
      id: uuidv4(),
      ...body,
      endpointId: endpoint.id,
      endpoint,
      institution,
    },
    ctx.query,
  );

  if (body.id) {
    const sushiCredentialsService = new SushiCredentialsService();

    const sushi = await sushiCredentialsService.findUnique({ where: { id: body.id } });

    await sushiCredentialsService.update({
      where: { id: sushi.id },
      data: {
        updatedAt: sushi.updatedAt,
        connection: connectionData,
      },
    });
  }

  ctx.body = {
    ...connectionData,
    date: formatISO(connectionData.date),
  };
};

exports.checkSushiConnection = async (ctx) => {
  ctx.action = 'sushi/checkConnection';
  ctx.type = 'json';

  const { sushi } = ctx.state;

  ctx.metadata = {
    sushiId: sushi.id,
    vendor: sushi.endpoint.vendor,
    institutionId: sushi.institution.id,
    institutionName: sushi.institution.name,
  };

  const connectionData = await checkConnection(sushi, ctx.query);

  const sushiCredentialsService = new SushiCredentialsService();

  ctx.body = await sushiCredentialsService.update({
    where: { id: sushi.id },
    data: {
      updatedAt: sushi.updatedAt,
      connection: connectionData,
    },
  });
};

exports.deleteSushiConnection = async (ctx) => {
  ctx.action = 'sushi/deleteConnection';
  ctx.type = 'json';

  const { sushi } = ctx.state;

  const sushiCredentialsService = new SushiCredentialsService();

  await sushiCredentialsService.update({
    where: { id: sushi.id },
    data: {
      updatedAt: sushi.updatedAt,
      connection: {},
    },
  });
  ctx.status = 204;
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

  /**
   * @param {SushiCredentialsService} sushiCredentialsService
   * @param {*} data
   */
  const importItem = async (sushiCredentialsService, data = {}) => {
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

  await SushiCredentialsService.$transaction(async (sushiCredentialsService) => {
    for (let i = 0; i < body.length; i += 1) {
      const sushiData = body[i] || {};

      try {
        // eslint-disable-next-line no-await-in-loop
        await importItem(sushiCredentialsService, sushiData);
      } catch (e) {
        addResponseItem(sushiData, 'error', e.message);
      }
    }
  });

  ctx.type = 'json';
  ctx.body = response;
};

exports.getSushiUrls = async (ctx) => {
  const { endpoint, ...sushi } = ctx.state.sushi;

  const threeMonthAgo = subMonths(new Date(), 3);

  const options = {
    reportType: endpoint.testedReport || 'pr',
    beginDate: format(threeMonthAgo, 'yyyy-MM'),
    endDate: format(threeMonthAgo, 'yyyy-MM'),
  };

  ctx.type = 'json';
  ctx.body = Object.fromEntries(
    endpoint.counterVersions.map((version) => {
      const firstMonthAvailable = endpoint.counterVersionsAvailability?.[version] ?? '';

      const downloadConfig = sushiService.getReportDownloadConfig(
        endpoint,
        sushi,
        version,
        options,
      );

      const url = new URL(downloadConfig.url);
      url.search = new URLSearchParams(downloadConfig.params);

      return [
        version,
        { url: url.href, firstMonthAvailable },
      ];
    }),
  );
};

const fs = require('fs-extra');
const path = require('path');
const format = require('date-fns/format');
const subMonths = require('date-fns/subMonths');
const { v4: uuidv4 } = require('uuid');
const send = require('koa-send');

const Task = require('../../models/Task');
const elastic = require('../../services/elastic');
const sushiService = require('../../services/sushi');
const { appLogger } = require('../../services/logger');
const { harvestQueue } = require('../../services/jobs');

const sushiCredentialsService = require('../../entities/sushi-credentials.service');

exports.getAll = async (ctx) => {
  const where = {};
  const { query = {} } = ctx.request;
  const {
    id: sushiIds,
    institutionId,
    endpointId,
  } = query;

  if (sushiIds) {
    where.id = Array.isArray(sushiIds)
      ? { in: sushiIds }
      : { equals: sushiIds };
  }
  if (institutionId) {
    where.institutionId = Array.isArray(institutionId)
      ? { in: institutionId }
      : { equals: institutionId };
  }
  if (endpointId) {
    where.endpointId = Array.isArray(endpointId)
      ? { in: endpointId }
      : { equals: endpointId };
  }

  ctx.type = 'json';
  ctx.status = 200;
  ctx.body = await sushiCredentialsService.findMany({ where });
};

exports.getOne = async (ctx) => {
  const { sushi } = ctx.state;

  ctx.status = 200;
  ctx.body = sushi;
};

exports.getTasks = async (ctx) => {
  const { sushi } = ctx.state;

  ctx.status = 200;
  ctx.body = await Task.findBySushiId(sushi.getId());
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

exports.deleteSushiData = async (ctx) => {
  ctx.action = 'sushi/delete-many';
  const { body } = ctx.request;
  const { userIsAdmin, institution } = ctx.state;

  const sushiItems = await sushiCredentialsService.findMany({
    where: { id: { in: body.ids } },
    include: {
      endpoint: {
        select: { vendor: true },
      },
    },
  });

  const response = await Promise.all(sushiItems.map(async (sushiItem) => {
    const result = {
      id: sushiItem.id,
      vendor: sushiItem.endpoint?.vendor,
    };

    if (!userIsAdmin && (sushiItem.institutionId !== institution.id)) {
      return { ...result, status: 'failed' };
    }

    try {
      await sushiCredentialsService.delete({ where: { id: sushiItem.id } });
      return { ...result, status: 'deleted' };
    } catch (error) {
      appLogger.error(`Failed to delete sushi data: ${error}`);
      return { ...result, status: 'failed' };
    }
  }));

  ctx.metadata = {
    sushiDeleteResult: response,
  };

  ctx.status = 200;
  ctx.body = response;
};

exports.getAvailableReports = async (ctx) => {
  const { sushi, endpoint } = ctx.state;

  let data;
  let headers;
  let exceptions;

  try {
    ({ data, headers } = await sushiService.getAvailableReports(endpoint, sushi));
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
    sushiId: sushi.getId(),
    vendor: sushi.get('vendor'),
    institutionId: institution.getId(),
    institutionName: institution.get('name'),
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
        href: `/api/sushi/${sushi.getId()}/files/${parentDirPath}/${filename}`,
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
    reportType,
    ignoreValidation,
    harvestId,
    timeout,
  } = body;
  let { beginDate, endDate } = body;
  const {
    endpoint,
    sushi,
    user,
    institution,
  } = ctx.state;

  let index = target;

  if (!index) {
    const prefix = institution.get('indexPrefix');

    if (!prefix) {
      ctx.throw(400, ctx.$t('errors.harvest.noTarget', institution.getId()));
    }

    index = `${prefix}-publisher`;
  }

  ctx.metadata = {
    sushiId: sushi.getId(),
    vendor: sushi.get('vendor'),
    institutionId: institution.getId(),
    institutionName: institution.get('name'),
    reportType,
  };

  const currentTask = await Task.findOne({
    filters: [
      Task.filterBy('params.sushiId', sushi.getId()),
      Task.filterBy('status', ['waiting', 'running']),
    ],
  });

  if (currentTask) {
    ctx.throw(409, ctx.$t('errors.harvest.taskExists', sushi.getId(), currentTask.get('status')));
  }

  const { body: perm } = await elastic.security.hasPrivileges({
    username: user.username,
    body: {
      index: [{ names: [index], privileges: ['write'] }],
    },
  }, {
    headers: { 'es-security-runas-user': user.username },
  });
  const canWrite = perm && perm.index && perm.index[index] && perm.index[index].write;

  if (!canWrite) {
    ctx.throw(403, `you don't have permission to write in ${index}`);
  }

  if (!beginDate && !endDate) {
    const prevMonth = format(subMonths(new Date(), 1), 'yyyy-MM');
    beginDate = prevMonth;
    endDate = prevMonth;
  } else if (!beginDate) {
    beginDate = endDate;
  } else if (!endDate) {
    endDate = beginDate;
  }

  const task = new Task({
    type: 'sushi-harvest',
    status: 'waiting',
    params: {
      sushiId: sushi.getId(),
      endpointId: sushi.get('endpointId'),
      institutionId: institution.getId(),
      harvestId: harvestId || uuidv4(),
      username: user.username,
      timeout,
      reportType,
      index,
      beginDate,
      endDate,
      forceDownload,
      ignoreValidation,
      endpointVendor: endpoint.get('vendor'),
      sushiLabel: sushi.get('vendor'),
      sushiPackage: sushi.get('package'),
      institutionName: institution.get('name'),
    },
  });

  await task.save();
  await harvestQueue.add(
    { taskId: task.getId(), timeout },
    { jobId: task.getId() },
  );

  ctx.type = 'json';
  ctx.body = task;
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

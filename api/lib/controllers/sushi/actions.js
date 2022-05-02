const fs = require('fs-extra');
const format = require('date-fns/format');
const subMonths = require('date-fns/subMonths');
const { v4: uuidv4 } = require('uuid');

const Sushi = require('../../models/Sushi');
const Task = require('../../models/Task');
const elastic = require('../../services/elastic');
const sushiService = require('../../services/sushi');
const { appLogger } = require('../../services/logger');
const { harvestQueue } = require('../../services/jobs');

exports.getAll = async (ctx) => {
  const options = { filters: [] };
  const { query = {} } = ctx.request;
  const {
    id: sushiIds,
    institutionId,
    endpointId,
    connection,
  } = query;

  if (sushiIds) {
    options.filters.push(Sushi.filterById(Array.isArray(sushiIds) ? sushiIds : sushiIds.split(',').map((s) => s.trim())));
  }
  if (institutionId) {
    options.filters.push(Sushi.filterBy('institutionId', Array.isArray(institutionId) ? institutionId : institutionId.split(',').map((s) => s.trim())));
  }
  if (endpointId) {
    options.filters.push(Sushi.filterBy('endpointId', Array.isArray(endpointId) ? endpointId : endpointId.split(',').map((s) => s.trim())));
  }

  if (connection === 'untested') {
    options.must_not = [{
      exists: { field: `${Sushi.type}.connection.success` },
    }];
  } else if (connection) {
    options.filters.push({
      term: { [`${Sushi.type}.connection.success`]: connection === 'working' },
    });
  }

  ctx.type = 'json';
  ctx.status = 200;
  ctx.body = await Sushi.findAll(options);
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
  const { body } = ctx.request;
  const { institution } = ctx.state;

  ctx.metadata = {
    vendor: body.vendor,
    institutionId: institution.getId(),
    institutionName: institution.get('name'),
  };

  const sushiItem = new Sushi(body);
  await sushiItem.save();

  ctx.metadata.sushiId = sushiItem.getId();
  ctx.status = 201;
  ctx.body = sushiItem;
};

exports.updateSushi = async (ctx) => {
  ctx.action = 'sushi/update';
  const { sushi, institution } = ctx.state;
  const { body } = ctx.request;

  sushi.update(body);
  sushi.set('connection', undefined);

  ctx.metadata = {
    sushiId: sushi.getId(),
    vendor: sushi.get('vendor'),
    institutionId: institution.getId(),
    institutionName: institution.get('name'),
  };

  try {
    await sushi.save();
  } catch (e) {
    throw new Error(e);
  }

  ctx.status = 200;
  ctx.body = sushi;
};

exports.deleteSushiData = async (ctx) => {
  ctx.action = 'sushi/delete-many';
  const { body } = ctx.request;
  const { userIsAdmin, institution } = ctx.state;

  const sushiItems = await Sushi.findManyById(body.ids);

  const response = await Promise.all(sushiItems.map(async (sushiItem) => {
    const result = {
      id: sushiItem.getId(),
      vendor: sushiItem.get('vendor'),
    };

    if (!userIsAdmin && (sushiItem.getInstitutionId() !== institution.id)) {
      return { ...result, status: 'failed' };
    }

    try {
      await sushiItem.delete();
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

exports.harvestSushi = async (ctx) => {
  ctx.action = 'sushi/harvest';
  const { body = {} } = ctx.request;
  const {
    target,
    forceDownload,
    reportType,
    ignoreValidation,
    harvestId,
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
      Task.filterBy('status', ['waiting', 'running', 'delayed']),
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
    { taskId: task.getId() },
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
  const institutionId = institution.getId();

  ctx.metadata = {
    institutionId: institution.getId(),
    institutionName: institution.get('name'),
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

  const importItem = async (sushiData = {}) => {
    if (sushiData.id) {
      const sushiItem = await Sushi.findById(sushiData.id);

      if (sushiItem && sushiItem.get('institutionId') !== institutionId) {
        addResponseItem(sushiData, 'error', ctx.$t('errors.sushi.import.belongsToAnother', sushiItem.getId()));
        return;
      }

      if (sushiItem && !overwrite) {
        addResponseItem(sushiData, 'conflict', ctx.$t('errors.sushi.import.alreadyExists', sushiItem.getId()));
        return;
      }
    }

    const sushiItem = new Sushi({
      ...sushiData,
      institutionId,
    });

    sushiItem.setId(sushiData.id);

    await sushiItem.save();

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

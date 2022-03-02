const fs = require('fs-extra');
const format = require('date-fns/format');
const subMonths = require('date-fns/subMonths');

const Sushi = require('../../models/Sushi');
const Task = require('../../models/Task');
const elastic = require('../../services/elastic');
const sushiService = require('../../services/sushi');
const { appLogger } = require('../../services/logger');
const { harvestQueue } = require('../../services/jobs');

exports.getAll = async (ctx) => {
  const options = {};
  const connection = ctx.query?.connection;

  if (connection === 'untested') {
    options.must_not = [{
      exists: { field: `${Sushi.type}.connection.success` },
    }];
  } else if (connection) {
    options.filters = [{
      term: { [`${Sushi.type}.connection.success`]: connection === 'working' },
    }];
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

  let reports;
  let exceptions;

  try {
    const { data } = await sushiService.getAvailableReports(endpoint, sushi);
    reports = data;
  } catch (e) {
    exceptions = sushiService.getExceptions(e && e.response && e.response.data);

    if (!Array.isArray(exceptions) || exceptions.length === 0) {
      ctx.throw(502, e);
    }
  }

  if (!Array.isArray(exceptions) || exceptions.length === 0) {
    exceptions = sushiService.getExceptions(reports);
  }

  if (exceptions.length > 0) {
    ctx.status = 502;
    ctx.body = { exceptions };
    return;
  }

  const isValidReport = (report) => (report.Report_ID && report.Report_Name);

  if (!Array.isArray(reports) || !reports.every(isValidReport)) {
    ctx.throw(502, ctx.$t('errors.sushi.invalidResponse'));
  }

  ctx.status = 200;
  ctx.body = reports;
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
      .on('finish', (filePath) => {
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
  const { sushi, user, institution } = ctx.state;
  const { target, forceDownload } = body;
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
  };

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
      institutionId: institution.getId(),
      username: user.username,
      index,
      beginDate,
      endDate,
      forceDownload,
      endpointVendor: endpoint.get('vendor'),
      sushiLabel: sushi.get('vendor'),
      institutionName: institution.get('name'),
    },
  });

  await task.save();
  await harvestQueue.add({ taskId: task.getId() });

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

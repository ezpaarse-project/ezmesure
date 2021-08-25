const fs = require('fs-extra');
const format = require('date-fns/format');
const subMonths = require('date-fns/subMonths');

const Institution = require('../../models/Institution');
const Sushi = require('../../models/Sushi');
const Task = require('../../models/Task');
const elastic = require('../../services/elastic');
const sushiService = require('../../services/sushi');
const { appLogger } = require('../../../server');

const isAdmin = (user) => {
  const roles = new Set((user && user.roles) || []);
  return (roles.has('admin') || roles.has('superuser'));
};

exports.getAll = async (ctx) => {
  ctx.type = 'json';
  ctx.status = 200;
  const { user } = ctx.state;

  if (!isAdmin(user)) {
    ctx.throw(403, ctx.$t('errors.unauthorized'));
    return;
  }

  ctx.body = await Sushi.findAll();
};

exports.getOne = async (ctx) => {
  const { sushiId } = ctx.params;
  const { user } = ctx.state;

  const sushiItem = await Sushi.findById(sushiId);

  if (!sushiItem) {
    ctx.throw(404, ctx.$t('errors.sushi.notFound'));
    return;
  }

  if (!isAdmin(user)) {
    const institution = await sushiItem.getInstitution();

    if (!institution || !institution.isContact(user)) {
      ctx.throw(403, ctx.$t('errors.sushi.unauthorized'));
      return;
    }
  }

  ctx.status = 200;
  ctx.body = sushiItem;
};

exports.getTasks = async (ctx) => {
  const { sushiId } = ctx.params;
  const { user } = ctx.state;

  const sushiItem = await Sushi.findById(sushiId);

  if (!sushiItem) {
    ctx.throw(404, ctx.$t('errors.sushi.notFound'));
    return;
  }

  if (!isAdmin(user)) {
    const institution = await sushiItem.getInstitution();

    if (!institution || !institution.isContact(user)) {
      ctx.throw(403, ctx.$t('errors.sushi.unauthorized'));
      return;
    }
  }

  ctx.status = 200;
  ctx.body = await Task.findBySushiId(sushiId);
};

exports.addSushi = async (ctx) => {
  const { body } = ctx.request;
  const { user } = ctx.state;

  const institution = await Institution.findById(body.institutionId);

  if (!institution) {
    ctx.throw(404, ctx.$t('errors.institution.notFound'));
    return;
  }

  if (!isAdmin(user)) {
    if (!institution.isContact(user)) {
      ctx.throw(403, ctx.$t('errors.sushi.unauthorized'));
      return;
    }
    if (!institution.isValidated()) {
      ctx.throw(400, ctx.$t('errors.sushi.institutionNotValidated'));
      return;
    }
  }

  const sushiItem = new Sushi(body);
  await sushiItem.save();

  ctx.status = 201;
  ctx.body = sushiItem;
};

exports.updateSushi = async (ctx) => {
  const { sushiId } = ctx.params;
  const { user } = ctx.state;
  const { body } = ctx.request;

  const sushiItem = await Sushi.findById(sushiId);

  if (!sushiItem) {
    ctx.throw(404, ctx.$t('errors.sushi.notFound'));
    return;
  }

  if (!isAdmin(user)) {
    const institution = await sushiItem.getInstitution();

    if (!institution || !institution.isContact(user)) {
      ctx.throw(403, ctx.$t('errors.sushi.unauthorized'));
      return;
    }
    if (!institution.isValidated()) {
      ctx.throw(400, ctx.$t('errors.sushi.institutionNotValidated'));
      return;
    }
  }

  sushiItem.update(body);

  try {
    await sushiItem.save();
  } catch (e) {
    throw new Error(e);
  }

  ctx.status = 200;
  ctx.body = sushiItem;
};

exports.deleteSushiData = async (ctx) => {
  const { body } = ctx.request;
  const { user } = ctx.state;

  const institution = await Institution.findOneByCreatorOrRole(user.username, user.roles);

  if (!isAdmin(user)) {
    if (!institution || !institution.isContact(user)) {
      ctx.throw(403, ctx.$t('errors.sushi.unauthorized'));
      return;
    }
    if (!institution.isValidated()) {
      ctx.throw(400, ctx.$t('errors.sushi.institutionNotValidated'));
      return;
    }
  }

  const sushiItems = await Sushi.findManyById(body.ids);

  const response = await Promise.all(sushiItems.map(async (sushiItem) => {
    if (!isAdmin(user) && (sushiItem.getInstitutionId() !== institution.id)) {
      return { id: sushiItem.id, status: 'failed' };
    }


    try {
      await sushiItem.delete();
      return { id: sushiItem.id, status: 'deleted' };
    } catch (error) {
      appLogger.error('Failed to delete sushi data', error);
      return { id: sushiItem.id, status: 'failed' };
    }
  }));

  ctx.status = 200;
  ctx.body = response;
};

exports.getAvailableReports = async (ctx) => {
  const { sushiId } = ctx.params;
  const { user } = ctx.state;

  const sushi = await Sushi.findById(sushiId);

  if (!sushi) {
    ctx.throw(404, ctx.$t('errors.sushi.notFound'));
    return;
  }


  if (!isAdmin(user)) {
    const institution = await sushi.getInstitution();

    if (!institution || !institution.isContact(user)) {
      ctx.throw(403, ctx.$t('errors.sushi.unauthorized'));
      return;
    }
    if (!institution.isValidated()) {
      ctx.throw(400, ctx.$t('errors.sushi.institutionNotValidated'));
      return;
    }
  }

  let reports;
  let exceptions;

  try {
    const { data } = await sushiService.getAvailableReports(sushi);
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
  const { sushiId } = ctx.params;
  const { query = {} } = ctx.request;
  const { user } = ctx.state;
  let { beginDate, endDate } = query;

  if (!beginDate && !endDate) {
    const prevMonth = format(subMonths(new Date(), 1), 'yyyy-MM');
    beginDate = prevMonth;
    endDate = prevMonth;
  } else if (beginDate) {
    endDate = beginDate;
  } else {
    beginDate = endDate;
  }

  const sushi = await Sushi.findById(sushiId);

  if (!sushi) {
    ctx.throw(404, ctx.$t('errors.sushi.notFound'));
    return;
  }

  const institution = sushi.getInstitution();

  if (!isAdmin(user)) {
    if (!institution || !institution.isContact(user)) {
      ctx.throw(403, ctx.$t('errors.sushi.unauthorized'));
      return;
    }
    if (!institution.isValidated()) {
      ctx.throw(400, ctx.$t('errors.sushi.institutionNotValidated'));
      return;
    }
  }

  const sushiData = { sushi, beginDate, endDate };
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

exports.importSushi = async (ctx) => {
  const { sushiId } = ctx.params;
  const { body = {} } = ctx.request;
  const { user } = ctx.state;
  const {
    target: index,
    beginDate,
    endDate,
  } = body;

  const sushi = await Sushi.findById(sushiId);

  if (!sushi) {
    ctx.throw(404, ctx.$t('errors.sushi.notFound'));
    return;
  }

  const institution = await sushi.getInstitution();

  if (!isAdmin(user)) {
    if (!institution || !institution.isContact(user)) {
      ctx.throw(403, ctx.$t('errors.sushi.unauthorized'));
      return;
    }
    if (!institution.isValidated()) {
      ctx.throw(400, ctx.$t('errors.sushi.institutionNotValidated'));
      return;
    }
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

  const task = await sushiService.initSushiImport({
    sushi,
    institution,
    user,
    index,
    beginDate,
    endDate,
  });

  task.on('finish', () => {
    const validationStep = task.getStep('validation') || {};
    const date = validationStep.startTime || new Date();
    const success = validationStep.status === 'finished';

    Sushi.setConnectionStateById(sushiId, { date, success })
      .then(() => {
        appLogger.info(`Sushi ${sushiId}: connection state changed to ${success ? 'success' : 'failure'}`);
      })
      .catch((e) => {
        appLogger.error('Failed to save sushi connection status');
        appLogger.error(e);
      });
  });

  ctx.type = 'json';
  ctx.body = task;
};

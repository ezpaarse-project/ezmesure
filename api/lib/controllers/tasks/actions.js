const Task = require('../../models/Task');

const isAdmin = (user) => {
  const roles = new Set((user && user.roles) || []);
  return (roles.has('admin') || roles.has('superuser'));
};

exports.getAll = async (ctx) => {
  ctx.type = 'json';
  ctx.status = 200;
  const { query = {} } = ctx.request;
  const {
    status,
    type,
    institutionId,
    sushiId,
  } = query;

  const filters = [];

  if (status) {
    filters.push(Task.filterBy('status', Array.isArray(status) ? status : status.split(',').map((s) => s.trim())));
  }
  if (type) {
    filters.push(Task.filterBy('type', Array.isArray(type) ? type : type.split(',').map((s) => s.trim())));
  }
  if (institutionId) {
    filters.push(Task.filterBy('institutionId', Array.isArray(institutionId) ? institutionId : institutionId.split(',').map((s) => s.trim())));
  }
  if (sushiId) {
    filters.push(Task.filterBy('sushiId', Array.isArray(sushiId) ? sushiId : sushiId.split(',').map((s) => s.trim())));
  }

  ctx.body = await Task.findAll({ filters });
};

exports.getOne = async (ctx) => {
  const { taskId } = ctx.params;
  const { user } = ctx.state;

  const task = await Task.findById(taskId);

  if (!task) {
    ctx.throw(404, ctx.$t('errors.task.notFound'));
    return;
  }

  if (!isAdmin(user)) {
    const institution = await task.getInstitution();

    if (!institution || !institution.isContact(user)) {
      ctx.throw(403, ctx.$t('errors.task.unauthorized'));
      return;
    }
  }

  ctx.status = 200;
  ctx.body = task;
};

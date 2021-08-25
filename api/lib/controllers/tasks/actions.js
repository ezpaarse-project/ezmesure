const Task = require('../../models/Task');

const isAdmin = (user) => {
  const roles = new Set((user && user.roles) || []);
  return (roles.has('admin') || roles.has('superuser'));
};

exports.getAll = async (ctx) => {
  ctx.type = 'json';
  ctx.status = 200;
  const { user } = ctx.state;
  const { query = {} } = ctx.request;
  const { status } = query;

  if (!isAdmin(user)) {
    ctx.throw(403, 'You are not authorized to access this route');
    return;
  }

  if (typeof status === 'string') {
    ctx.body = await Task.findByStatus(status.split(',').map((s) => s.trim()));
  } else {
    ctx.body = await Task.findAll();
  }
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

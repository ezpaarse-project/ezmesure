const Task = require('../../models/Task');
const { harvestQueue } = require('../../services/jobs');

exports.getAll = async (ctx) => {
  ctx.type = 'json';
  ctx.status = 200;
  const { query = {} } = ctx.request;
  const {
    id: taskIds,
    status,
    type,
    harvestId,
    sushiId,
    endpointId,
    institutionId,
    collapse,
  } = query;

  const filters = [];

  if (taskIds) {
    filters.push(Task.filterById(Array.isArray(taskIds) ? taskIds : taskIds.split(',').map((s) => s.trim())));
  }
  if (status) {
    filters.push(Task.filterBy('status', Array.isArray(status) ? status : status.split(',').map((s) => s.trim())));
  }
  if (type) {
    filters.push(Task.filterBy('type', Array.isArray(type) ? type : type.split(',').map((s) => s.trim())));
  }
  if (institutionId) {
    filters.push(Task.filterBy('params.institutionId', Array.isArray(institutionId) ? institutionId : institutionId.split(',').map((s) => s.trim())));
  }
  if (sushiId) {
    filters.push(Task.filterBy('params.sushiId', Array.isArray(sushiId) ? sushiId : sushiId.split(',').map((s) => s.trim())));
  }
  if (endpointId) {
    filters.push(Task.filterBy('params.endpointId', Array.isArray(endpointId) ? endpointId : endpointId.split(',').map((s) => s.trim())));
  }
  if (harvestId) {
    filters.push(Task.filterBy('params.harvestId', Array.isArray(harvestId) ? harvestId : harvestId.split(',').map((s) => s.trim())));
  }

  const options = { filters };

  if (typeof collapse === 'string') {
    options.collapse = { field: `${Task.type}.${collapse}` };
  }

  ctx.body = await Task.findAll(options);
};

exports.getOne = async (ctx) => {
  const { taskId } = ctx.params;
  const { user, userIsAdmin } = ctx.state;

  const task = await Task.findById(taskId);

  if (!task) {
    ctx.throw(404, ctx.$t('errors.task.notFound'));
    return;
  }

  if (!userIsAdmin) {
    const institution = await task.getInstitution();

    if (!institution || !institution.isContact(user)) {
      ctx.throw(403, ctx.$t('errors.task.unauthorized'));
      return;
    }
  }

  ctx.status = 200;
  ctx.body = task;
};

exports.cancelOne = async (ctx) => {
  const { taskId } = ctx.params;

  const task = await Task.findById(taskId);

  if (!task) {
    ctx.throw(404, ctx.$t('errors.task.notFound'));
    return;
  }

  const job = await harvestQueue.getJob(taskId);

  if (job) {
    if (await job.isActive()) {
      ctx.throw(409, ctx.$t('errors.tasks.cannnotCancelActiveTask'));
    }

    await job.remove();
  }

  if (!task.isDone()) {
    task.cancel();
    await task.save();
  }

  ctx.status = 200;
  ctx.body = task;
};

exports.deleteOne = async (ctx) => {
  const { taskId } = ctx.params;

  const job = await harvestQueue.getJob(taskId);

  if (job) {
    if (await job.isActive()) {
      ctx.throw(409, ctx.$t('errors.tasks.cannnotDeleteActiveTask'));
    }

    await job.remove();
  }

  await Task.deleteOne(taskId);

  ctx.status = 204;
};

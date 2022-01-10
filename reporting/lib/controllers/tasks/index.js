const router = require('koa-joi-router')();
const { Joi } = require('koa-joi-router');
const bodyParser = require('koa-bodyparser');
const { frequencies } = require('config');
const hasPrivileges = require('../../services/hasPrivileges');
const isSuperuser = require('../../services/isSuperuser');

const {
  getBySpace,
  getAll,
  store,
  update,
  del,
  history,
  getHistory,
  download,
} = require('./actions');

const validate = {
  type: 'json',
  failure: 400,
  body: {
    dashboardId: Joi.string().trim().min(1).required(),
    space: Joi.string().trim().required(),
    frequency: Joi.string().trim().required().valid(...frequencies.map((f) => f.value)),
    emails: Joi.array().items(Joi.string().trim().email()).min(1),
    print: Joi.boolean().required(),
  },
};

router.route({
  method: 'GET',
  path: '/:space',
  handler: [
    hasPrivileges(['read']),
    getBySpace,
  ],
  validate: {
    failure: 400,
    continueOnError: true,
    params: {
      space: Joi.string().trim(),
    },
  },
});

router.route({
  method: 'GET',
  path: '/',
  handler: [
    isSuperuser,
    getAll,
  ],
});

router.route({
  method: 'POST',
  path: '/',
  handler: [
    bodyParser(),
    hasPrivileges(['create']),
    store,
  ],
  validate,
});

router.route({
  method: 'DELETE',
  path: '/:taskId',
  handler: [
    hasPrivileges(['delete']),
    del,
  ],
  validate: {
    failure: 400,
    continueOnError: true,
    params: {
      taskId: Joi.string().required(),
    },
  },
});

router.route({
  method: 'GET',
  path: '/:taskId/download',
  handler: [
    hasPrivileges(['read']),
    download,
  ],
  validate: {
    failure: 400,
    continueOnError: true,
    params: {
      taskId: Joi.string().trim(),
    },
  },
});

router.route({
  method: 'PATCH',
  path: '/:taskId',
  handler: [
    bodyParser(),
    hasPrivileges(['write']),
    update,
  ],
  validate: {
    ...validate,
    params: {
      taskId: Joi.string().required(),
    },
  },
});

router.route({
  method: 'GET',
  path: '/history/:taskId',
  handler: [
    hasPrivileges(['read']),
    history,
  ],
  validate: {
    failure: 400,
    continueOnError: true,
    params: {
      taskId: Joi.string().required(),
    },
  },
});

module.exports = router;
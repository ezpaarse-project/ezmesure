const router = require('koa-joi-router')();
const { Joi } = require('koa-joi-router');
const bodyParser = require('koa-bodyparser');
const { index, frequencies } = require('config');

const {
  getBySpace,
  getAll,
  store,
  update,
  del,
  history,
  download,
} = require('./actions');
const elastic = require('../../services/elastic');

function hasPrivileges(privileges) {
  return async (ctx, next) => {
    const { user } = ctx.query;

    if (!user) {
      ctx.status = 400;
      ctx.type = 'json';
      ctx.body = {
        error: 'No user specified.',
        code: 400,
      };
      return;
    }

    try {
      const { body: perm } = await elastic.security.hasPrivileges({
        user,
        body: {
          index: [{ names: [index], privileges }],
        },
      }, {
        headers: { 'es-security-runas-user': user },
      });

      const perms = (perm && perm.index && perm.index[index]) || {};
      const canMakeAction = privileges.every((privilege) => perms[privilege]);

      if (canMakeAction) {
        await next();
      } else {
        ctx.status = 403;
        ctx.type = 'json';
        ctx.body = {
          error: 'You have no rights to access this page.',
          code: 403,
        };
      }
    } catch (e) {
      ctx.status = 403;
      ctx.type = 'json';
      ctx.body = {
        error: 'You are not authorize to access this page.',
        code: 403,
      };
    }
  };
}

const validate = {
  type: 'json',
  failure: 400,
  body: {
    dashboardId: Joi.string().trim().min(1).required(),
    space: Joi.string().trim().required(),
    frequency: Joi.string().trim().required().valid(frequencies.map((f) => f.value)),
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
    hasPrivileges(['create']),
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
  path: '/:taskId/history',
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

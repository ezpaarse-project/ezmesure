const Koa = require('koa');
const router = require('koa-joi-router');

const route = router();
const { Joi } = router;
const bodyParser = require('koa-bodyparser');
const { index, frequencies } = require('config');

const {
  list,
  store,
  update,
  del,
  history,
  download,
} = require('./reporting');
const elastic = require('../../services/elastic');

const app = new Koa();

function hasPrivileges(privileges) {
  return async (ctx, next) => {
    const { user } = ctx.query;

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
  };
}

route.get('/tasks/:space?', hasPrivileges(['read']), list);

route.delete('/tasks/:taskId?', {
  validate: {
    failure: 400,
    continueOnError: true,
    params: {
      taskId: Joi.string().required(),
    },
  },
}, hasPrivileges(['delete']), del);

app.use(bodyParser());

const validate = {
  type: 'json',
  failure: 400,
  body: {
    dashboardId: Joi.string().guid().required(),
    space: Joi.string(),
    frequency: Joi.string().required().valid(frequencies.map((f) => f.value)),
    emails: Joi.string().required(),
    print: Joi.boolean().required(),
  },
};

route.post('/tasks', { validate }, hasPrivileges(['create']), store);

route.patch('/tasks/:taskId?', {
  validate: {
    ...validate,
    params: {
      taskId: Joi.string().required(),
    },
  },
}, hasPrivileges(['write']), update);

route.get('/tasks/:taskId?/history', hasPrivileges(['read']), history);

route.get('/tasks/:taskId?/download', hasPrivileges(['create']), download);

app.use(route.middleware());

module.exports = app;

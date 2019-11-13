const Koa = require('koa');
const router = require('koa-joi-router');

const route = router();
const { Joi } = router;
const bodyParser = require('koa-bodyparser');

const { list, store, update, del } = require('./reporting');
const { index } = require('config');
const elastic = require('../../services/elastic');

const app = new Koa();

const hasPrivileges = (privileges) => {
  return async (ctx, next) => {
    const { user } = ctx.query;

    const { body: perm } = await elastic.security.hasPrivileges({
      user,
      body: {
        index: [{ names: [index], privileges: privileges }],
      },
    }, {
      headers: { 'es-security-runas-user': user },
    });
    
    let canMakeAction = false;
    for (let privilege of privileges) {
      canMakeAction = perm.index[index][privilege];
    }

    if (canMakeAction) {
      await next();
    }
  
    if (!canMakeAction) {
      return ctx.throw(403, `You have no rights to access this page.`);
    }
  }
};

route.get('/tasks/:space?', hasPrivileges(['read']), list);

route.delete('/tasks/:taskId?', {
  validate: {
    failure: 400,
    continueOnError: true,
    params: {
      taskId: Joi.string().required(),
    },
  },
}, hasPrivileges(['write', 'read']), del);

app.use(bodyParser());

const validate = {
  type: 'json',
  failure: 400,
  continueOnError: true,
  body: {
    dashboardId: Joi.string().guid().required(),
    space: Joi.string(),
    frequency: Joi.string().required(),
    emails: Joi.string().required(),
    print: Joi.boolean().required(),
  },
};

route.post('/tasks', { validate }, hasPrivileges(['write', 'read']), store);

route.patch('/tasks/:taskId?', {
  validate: {
    ...validate,
    params: {
      taskId: Joi.string().required(),
    },
  },
}, hasPrivileges(['write', 'read']), update);

app.use(route.middleware());

module.exports = app;

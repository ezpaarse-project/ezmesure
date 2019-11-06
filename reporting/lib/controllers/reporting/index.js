const Koa = require('koa');
const router = require('koa-joi-router');

const route = router();
const { Joi } = router;
const bodyParser = require('koa-bodyparser');

const { list, store, update, del, report } = require('./reporting');

const app = new Koa();

route.get('/tasks/:space?', list);

route.delete('/tasks/:taskId?', {
  validate: {
    failure: 400,
    continueOnError: true,
    params: {
      taskId: Joi.string().required(),
    },
  },
}, del);

app.use(bodyParser());

const validate = {
  type: 'json',
  failure: 400,
  continueOnError: true,
  body: {
    dashboardId: Joi.string().guid().required(),
    space: Joi.string(),
    frequency: Joi.string().required(),
    emails: Joi.string().email({ multiple: true }).required(),
    print: Joi.boolean().required(),
  },
};

route.post('/tasks', { validate }, store);

route.patch('/tasks/:taskId?', {
  validate: {
    ...validate,
    params: {
      taskId: Joi.string().required(),
    },
  },
}, update);

app.use(route.middleware());

module.exports = app;

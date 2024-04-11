const router = require('koa-joi-router')();
const { Joi } = require('koa-joi-router');
const { bodyParser } = require('@koa/bodyparser');

const { getAll } = require('./actions');

router.use(bodyParser());
router.route({
  method: 'GET',
  path: '/',
  handler: getAll,
  validate: {
    query: Joi.object({
      size: Joi.number().min(-1),
      page: Joi.number().min(1),
      sort: Joi.string(),
      order: Joi.string().valid('asc', 'desc'),
      jobId: Joi.string(),
      level: Joi.string(),
      from: Joi.string().isoDate(),
      to: Joi.string().isoDate(),
    }).rename('include[]', 'include'),
  },
});

module.exports = router;

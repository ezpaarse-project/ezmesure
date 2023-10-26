const router = require('koa-joi-router')();
const { Joi } = require('koa-joi-router');

const {
  requireJwt,
  requireUser,
  requireAdmin,
} = require('../../services/auth');

const {
  getHarvests,
} = require('./actions');

router.use(
  requireJwt,
  requireUser,
  requireAdmin,
);

router.route({
  method: 'GET',
  path: '/',
  handler: [
    getHarvests,
  ],
  validate: {
    query: {
      from: Joi.string().regex(/^[0-9]{4}-[0-9]{2}$/),
      to: Joi.string().regex(/^[0-9]{4}-[0-9]{2}$/),
      reportId: Joi.string().trim(),
      size: Joi.number().min(0),
      page: Joi.number().min(1),
      sort: Joi.string(),
      order: Joi.string().valid('asc', 'desc'),
    },
  },
});

module.exports = router;

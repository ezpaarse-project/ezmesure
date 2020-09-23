const router = require('koa-joi-router')();
const { Joi } = require('koa-joi-router');
const bodyParser = require('koa-bodyparser');

const { contact } = require('./actions');

router.use(bodyParser());
router.route({
  method: 'POST',
  path: '/',
  handler: contact,
  validate: {
    type: 'json',
    body: {
      email: Joi.string().trim().email().required(),
      object: Joi.string().trim().required(),
      message: Joi.string().trim().required(),
      browser: Joi.empty(null),
    },
  },
});

module.exports = router;

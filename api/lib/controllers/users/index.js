const router = require('koa-joi-router')();
const { Joi } = require('koa-joi-router');

const { requireJwt, requireUser } = require('../../services/auth');
const { list, getUser } = require('./actions');

router.use(requireJwt, requireUser);

router.get('/', list);

router.route({
  method: 'GET',
  path: '/:username',
  handler: getUser,
  validate: {
    params: {
      username: Joi.string().trim().required(),
    },
  },
});

module.exports = router;

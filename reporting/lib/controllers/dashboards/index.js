const router = require('koa-joi-router')();
const { Joi } = require('koa-joi-router');
const { roleName } = require('config');

const { requireAnyRole } = require('../../services/auth');

const {
  getAll,
  getBySpace,
} = require('./actions');

router.get('/', requireAnyRole(['admin', 'superuser']), getAll);

router.get('/:space', {
  validate: {
    params: {
      space: Joi.string().trim(),
    },
  },
}, requireAnyRole([roleName, `${roleName}_read_only`]), getBySpace);

module.exports = router;

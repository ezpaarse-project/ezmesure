const router = require('koa-joi-router')();
const { roleName } = require('config');

const { requireAnyRole } = require('../../services/auth');

const {
  getAll,
} = require('./actions');

router.get('/', requireAnyRole([roleName, `${roleName}_read_only`, 'superuser', 'admin']), getAll);

module.exports = router;

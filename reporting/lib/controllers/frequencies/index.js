const router = require('koa-joi-router')();
const { roleName } = require('config');

const hasPrivileges = require('../../services/hasPrivileges');

const {
  getAll,
} = require('./actions');

router.get('/', hasPrivileges(['read']), getAll);

module.exports = router;

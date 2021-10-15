const router = require('koa-joi-router')();
const get = require('lodash.get');

const {
  getAll,
} = require('./actions');

router.get('/', getAll);

module.exports = router;

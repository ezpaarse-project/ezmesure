const router = require('koa-joi-router')();

const {
  getAll,
} = require('./actions');

router.route({
  method: 'GET',
  path: '/',
  handler: getAll,
});

module.exports = router;

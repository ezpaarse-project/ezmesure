const router = require('koa-joi-router')();

const { overall } = require('./actions');

router.get('/', overall);

module.exports = router;

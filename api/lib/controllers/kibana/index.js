const config = require('config');
const router = require('koa-joi-router')();
const { createProxyMiddleware } = require('http-proxy-middleware');

const { appLogger } = require('../../services/logger');

const username = config.get('elasticsearch.user');
const password = config.get('elasticsearch.password');
const host = config.get('kibana.host');
const port = config.get('kibana.port');

const authString = Buffer.from(`${username}:${password}`).toString('base64');

const { requireJwt, requireUser, requireAdmin } = require('../../services/auth');

const kibanaProxy = createProxyMiddleware({
  target: `http://${host}:${port}`,
  changeOrigin: true,
  pathRewrite: { '^/kibana': '/' },
  logProvider: () => appLogger,
  onProxyReq: (proxyReq) => {
    proxyReq.setHeader('Authorization', `Basic ${authString}`);
    proxyReq.setHeader('kbn-xsrf', true);
  },
});

router.use(requireJwt, requireUser, requireAdmin);

router.route({
  path: '(.*)',
  method: ['GET', 'POST', 'PUT', 'DELETE'],
  handler: async (ctx) => {
    // Tell Koa to not respond because the proxy does handle the response itself
    ctx.respond = false;

    kibanaProxy(ctx.req, ctx.res);

    // The proxy does not support promises, so we wait for the response to finish
    await new Promise((resolve, reject) => {
      ctx.res.on('error', reject);
      ctx.res.on('finish', resolve);
    });

    // Put the response status in the context so that it's properly logged
    ctx.status = ctx.res.statusCode;
  },
});

module.exports = router;

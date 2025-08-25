const router = require('koa-joi-router')();
const { parse: parseCookie } = require('cookie');

const { requireJwt, requireUser } = require('../services/auth');
const { appLogger } = require('../services/logger');

const { setRandomPasswordForUser } = require('../services/elastic/users');
const { loginUser } = require('../services/kibana');

const { redirectToFront } = require('./auth/oauth/middlewares');

router.route({
  method: 'GET',
  path: '/',
  handler: [
    redirectToFront,
    async (ctx) => {
      try {
        await requireJwt(ctx, () => {});
      } catch {
        // Try to login with OAuth
        ctx.redirect('/api/auth/oauth/login?origin=/kibana/login');
        return;
      }

      await requireUser(ctx, () => {});

      const { user } = ctx.state;
      const { next, msg } = ctx.query;

      if (msg === 'LOGGED_OUT') {
        // We logged out of Kibana, so we're redirecting to the main app
        ctx.redirect('/myspace');
        return;
      }

      let esUser;
      try {
        esUser = await setRandomPasswordForUser(user.username);
      } catch (err) {
        appLogger.error(`[kibana-bridge] Failed to update password: ${err}`);
        throw err;
      }

      let cookies = [];
      try {
        const res = await loginUser(esUser.username, esUser.password, ctx.href);
        cookies = res.headers['set-cookie'].map((str) => parseCookie(str));
      } catch (err) {
        appLogger.error(`[kibana-bridge] Failed to login into kibana: ${err}`);
        throw err;
      }

      // eslint-disable-next-line no-restricted-syntax
      for (const cookie of cookies) {
        const [[name, value], ...params] = Object.entries(cookie);
        ctx.cookies.set(name, value, Object.fromEntries(params));
      }

      ctx.redirect(next || '/kibana');
    },
  ],
});

module.exports = router;

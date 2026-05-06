const { appLogger } = require('../../../services/logger');

exports.redirectToFront = async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    appLogger.error(`[oauth] Couldn't process OAuth request: ${err}`);
    const b64Err = Buffer.from(
      JSON.stringify(err, Object.getOwnPropertyNames(err)),
    ).toString('base64');
    ctx.redirect(`/?error=${b64Err}`);
  }
};

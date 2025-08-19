exports.redirectToFront = async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    const b64Err = Buffer.from(JSON.stringify({ ...err })).toString('base64');
    ctx.redirect(`/?error=${b64Err}`);
  }
};

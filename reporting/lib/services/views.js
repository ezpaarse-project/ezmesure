// Middleware nunjucks

function render(instance) {
  return async (ctx, next) => {
    ctx.render = async (viewName, params = null) => {
      ctx.type = ctx.type || 'text/html';
      ctx.status = ctx.status || 200;
      try {
        ctx.body = instance.render(`${viewName}.html`, params);
      } catch (error) {
        ctx.type = 'json';
        ctx.status = 404;
        ctx.body = {
          statusCode: 404,
          error: error.message,
        };
      }
    };

    await next();
  };
}

module.exports = render;

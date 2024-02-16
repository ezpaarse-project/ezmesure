const elastic = require('./elastic');
const indexTemplate = require('../utils/metrics-template');

const index = '.ezmesure-metrics';

exports.save = async (ctx) => {
  const { body: exists } = await elastic.indices.exists({ index });

  if (!exists) {
    await elastic.indices.create({
      index,
      body: indexTemplate,
    });
  }

  const metric = {
    datetime: ctx.startTime,
    action: ctx.action,
    index: ctx.index,
    responseTime: ctx.responseTime,
    metadata: ctx.metadata,
    request: ctx.httpLog,
    response: {
      status: ctx.status,
      body: typeof ctx.body === 'object' ? ctx.body : null,
    },
  };

  switch (ctx.action) {
    case 'indices/list':
    case 'indices/search':
    case 'export/counter5':
    case 'file/list':
    case 'sushi/create':
    case 'sushi/update':
    case 'sushi/delete-many':
    case 'sushi/download-report':
    case 'sushi/harvest':
    case 'sushi/import':
    case 'institutions/import':
    case 'sushi/check-connection':
      if (metric.response.body && !metric.response.body.error) {
        metric.response.body = null;
      }
      break;
    default:
  }

  const username = ctx.state && ctx.state.user && ctx.state.user.username;

  if (username) {
    const user = await elastic.security.findUser({ username });

    metric.user = !user ? null : {
      name: user.username,
      roles: user.roles,
      idp: user.metadata && user.metadata.idp,
    };
  }

  return elastic.index({
    index,
    body: metric,
  }).then((res) => res.body);
};

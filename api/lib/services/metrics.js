const elastic = require('./elastic');
const indexTemplate = require('../utils/metrics-template');

const index = '.ezmesure-metrics';

exports.save = async function (ctx) {
  const exists = await elastic.indices.exists({ index });

  if (!exists) {
    await elastic.indices.create({
      index,
      body: indexTemplate
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
      body: typeof ctx.body === 'object' ? ctx.body : null
    }
  };

  switch (ctx.action) {
  case 'indices/list':
  case 'indices/search':
  case 'file/list':
    if (metric.response.body && !metric.response.body.error) {
      metric.response.body = null;
    }
  }

  const username = ctx.state && ctx.state.user && ctx.state.user.username;

  if (username) {
    const user = await elastic.findUser(username);

    metric.user = !user ? null : {
      name: user.username,
      roles: user.roles,
      idp: user.metadata && user.metadata.idp
    };
  }

  return elastic.index({
    index,
    type: '_doc',
    body: metric
  });
};

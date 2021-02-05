const config = require('config');
const elastic = require('./elastic');
const indexTemplate = require('../utils/activity-template');

const index = config.activityIndex || '.ezreporting-activity';

exports.save = async function save(ctx) {
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
    request: ctx.httpLog,
    response: {
      status: ctx.status,
      body: typeof ctx.body === 'object' ? JSON.stringify(ctx.body) : null,
    },
    taskId: ctx.taskId || null,
    metadata: ctx.metadata || null,
  };

  // eslint-disable-next-line default-case
  switch (ctx.action) {
    case 'reporting/list':
    case 'reporting/history':
    case 'reporting/delete':
      if (metric.response.body && !metric.response.body.error) {
        metric.response.body = null;
      }
  }

  const { user: username } = ctx.query;

  if (username) {
    const { body: user } = await elastic.security.getUser({ username });

    metric.user = !user[username] ? null : {
      name: user[username].username,
      roles: user[username].roles,
      idp: user[username].metadata && user[username].metadata.idp,
    };
  }

  return elastic.index({
    index,
    refresh: true,
    body: metric,
  }).then((res) => res.body);
};

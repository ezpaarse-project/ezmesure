const { index, historyIndex, frequencies, reportingName } = require('config');
const logger = require('../../logger');
const elastic = require('../../services/elastic');
const reporting = require('../../services/reporting');

async function getDashboards(namespace) {
  const bool = {
    must: [{
      match: {
        type: 'dashboard',
      },
    }],
  };

  if (namespace) {
    bool.must.push({
      match: {
        namespace,
      },
    });
  } else {
    bool.must_not = {
      exists: {
        field: 'namespace',
      },
    };
  }

  try {
    const { body: data } = await elastic.search({
      index: '.kibana',
      timeout: '30s',
      body: {
        size: 10000,
        query: {
          bool,
        },
      },
    });

    if (data && data.hits && data.hits.hits) {
      return data.hits.hits;
    }
  } catch (err) {
    logger.error(err);
    return [];
  }

  return [];
}

exports.list = async (ctx) => {
  logger.info('reporting/list');
  ctx.action = 'reporting/list';
  ctx.type = 'json';
  ctx.status = 200;

  const { space } = ctx.request.params;

  const dashboards = [];
  const tasks = [];

  let dashboardsData;
  try {
    dashboardsData = await getDashboards(space);
  } catch (err) {
    ctx.body = { tasks, dashboards, frequencies };
    logger.error(err);
    ctx.status = 500;
    return ctx;
  }

  for (let i = 0; i < dashboardsData.length; i += 1) {
    const element = dashboardsData[i];
    const dashboardId = element._id.split(':');

    dashboards.push({
      id: dashboardId[dashboardId.length - 1],
      name: element._source.dashboard.title,
    });
  }

  const bool = {
    must: [],
  };

  if (space) {
    bool.must.push({
      match: {
        space,
      },
    });
  }

  if (!space) {
    bool.must_not = {
      exists: {
        field: 'space',
      },
    };
  }

  let tasksData;
  try {
    tasksData = await elastic.search({
      index,
      timeout: '30s',
      body: {
        size: 10000,
        query: {
          bool,
        },
      },
    });
  } catch (err) {
    logger.error(err);
    ctx.status = 500;
  }

  if (tasksData) {
    const { hits } = tasksData.body.hits;

    for (let i = 0; i < hits.length; i += 1) {
      const dashboard = dashboards.find(({ id }) => id === hits[i]._source.dashboardId);
      tasks.push({
        _id: hits[i]._id,
        dashboardId: hits[i]._source.dashboardId,
        exists: dashboard ? true : false,
        reporting: {
          frequency: hits[i]._source.frequency,
          emails: hits[i]._source.emails,
          print: hits[i]._source.print,
          createdAt: hits[i]._source.createdAt,
          sentAt: hits[i]._source.sentAt,
        },
      });
    }
  }

  ctx.body = { tasks, dashboards, frequencies, reportingName };
};

exports.store = async (ctx) => {
  logger.info('reporting/store');
  ctx.action = 'reporting/store';
  ctx.status = 200;

  if (ctx.invalid) {
    ctx.status = 400;
    ctx.body = { errors: ctx.invalid.body };
    return ctx;
  }

  if (ctx.invalid) {
    const invalidBody = ctx.invalid.body;
    const errors = invalidBody.details.map(({ message }) => message);
    ctx.body = errors;
    return ctx;
  }

  const { body } = ctx.request;

  body.createdAt = new Date();
  body.updatedAt = new Date();
  body.sentAt = '1970-01-01T12:00:00.000Z';

  try {
    const { body: data } = await elastic.index({
      index,
      body,
    });

    ctx.body = {
      _id: data._id,
      createdAt: body.createdAt,
      sentAt: body.sentAt,
    };
  } catch (err) {
    logger.error(err);
    ctx.status = 500;
  }
};

exports.update = async (ctx) => {
  logger.info('reporting/update');
  ctx.action = 'reporting/update';
  ctx.status = 204;

  if (ctx.invalid) {
    const errors = [];

    const { params, body } = ctx.invalid;
    if (params) {
      params.details.forEach(({ message }) => errors.push(message));
    }

    if (body) {
      body.details.forEach(({ message }) => errors.push(message));
    }

    ctx.status = 400;
    ctx.body = errors;
    return ctx;
  }

  const { taskId: id } = ctx.request.params;

  const { body } = ctx.request;

  try {
    await elastic.update({
      index,
      id,
      body: {
        doc: {
          ...body,
          updatedAt: new Date(),
        },
      },
    });
  } catch (err) {
    logger.error(err);
    ctx.status = 500;
  }
};

exports.del = async (ctx) => {
  logger.info('reporting/delete');
  ctx.action = 'reporting/delete';
  ctx.status = 204;

  if (ctx.invalid) {
    const errors = [];

    const { params } = ctx.invalid;
    if (params) {
      params.details.forEach(({ message }) => errors.push(message));
    }

    ctx.status = 400;
    ctx.body = errors;
    return ctx;
  }

  const { taskId: id } = ctx.request.params;

  try {
    await elastic.delete({
      id,
      index,
    });
  } catch (err) {
    logger.error(err);
    ctx.status = 500;
  }

  try {
    await elastic.deleteByQuery({
      index: historyIndex,
      body: {
        query: {
          match: {
            taskId: id,
          },
        },
      },
    });
  } catch (err) {
    logger.error(err);
    ctx.status = 500;
  }
};

exports.history = async (ctx) => {
  logger.info('reporting/history');
  ctx.action = 'reporting/history';

  const { taskId: id } = ctx.request.params;

  if (!id) {
    ctx.status = 404;
  }

  try {
    const { body: data } = await elastic.search({
      index: historyIndex,
      timeout: '30s',
      body: {
        size: 10000,
        sort: {
          createdAt: {
            order: 'desc',
          },
        },
        query: {
          bool: {
            must: [
              {
                match: {
                  taskId: id,
                },
              },
            ],
          },
        },
      },
    });

    if (data && data.hits && data.hits.hits) {
      ctx.type = 'json';
      ctx.status = 200;

      const historiesData = [];
      const histories = [];
      data.hits.hits.forEach((history) => {
        let match;

        let date = history._source.createdAt;
        if ((match = /^([0-9]{4}-[0-9]{2}-[0-9]{2})T([0-9]{2}:[0-9]{2}:[0-9]{2}).([0-9]{3})Z$/i.exec(history._source.createdAt)) !== null) {
          date = `${match[1]}`;
        }

        histories.push({
          value: history._id,
          text: date,
        });

        history._source.id = history._id;
        historiesData.push(history._source); 
      });

      ctx.body = { historiesData, histories };
    }
  } catch (err) {
    logger.error(err);
    ctx.status = 500;
  }
};

exports.download = async (ctx) => {
  const { taskId } = ctx.request.params;

  let task;
  try {
    const { body } = await elastic.get({ id: taskId, index });
    task = body;
  } catch (e) {
    logger.error(`Cannot find task ${taskId}`);
  }

  if (!task) {
    ctx.status = 404;
    ctx.body = {
      statusCode: 404,
      error: `Cannot find task ${taskId}`,
    };
    return;
  }

  const { _source: source } = task;
  const frequencyData = frequencies.find((freq) => freq.value === source.frequency);

  if (!frequencyData) {
    ctx.status = 500;
    ctx.body = {
      statusCode: 500,
      error: `no frequency data found for task ${taskId}`,
    };
    return;
  }

    try {
    reporting(frequencyData, [task]);
      ctx.status = 200;
    } catch (err) {
      logger.err(err);
      ctx.status(500);
    }
};

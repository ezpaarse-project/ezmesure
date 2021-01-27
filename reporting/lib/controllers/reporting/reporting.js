const {
  index,
  historyIndex,
  frequencies,
} = require('config');
const logger = require('../../logger');
const elastic = require('../../services/elastic');
const { generateReport } = require('../../services/reporting');
const Frequency = require('../../services/frequency');
const client = require('../../services/elastic');

async function getMetadata(taskId) {
  const { body: data } = await elastic.getSource({
    index,
    id: taskId,
  });

  if (data) {
    const { body: dashboard } = await elastic.getSource({
      index: '.kibana',
      // eslint-disable-next-line no-underscore-dangle
      id: `${data.space ? `${data.space}:` : ''}dashboard:${data.dashboardId}`,
    });

    if (dashboard && dashboard.type === 'dashboard') {
      return {
        dashboardName: dashboard.dashboard.title,
        space: data.space || null,
      };
    }

    return null;
  }
  return null;
}

async function getSpaces(namespace) {
  const bool = {
    must: [{
      match: {
        type: 'space',
      },
    }],
  };

  if (namespace) {
    bool.must.push({
      match: {
        _id: `space:${namespace}`,
      },
    });
  }

  try {
    const { body } = await client.search({
      index: '.kibana',
      timeout: '30s',
      body: {
        size: 10000,
        query: {
          bool
        },
      },
    });
    
    if (body && body.hits && body.hits.hits) {
      if (body.hits.hits.length) {
        return body.hits.hits.map((space) => {
          return {
            id: space._id,
            name: space._id.split(':').pop(),
            color: space._source.space.color || '#00bfb3',
          }
        })
      }
      return [];
    }
  } catch (err) {
    logger.error(err);
    return [];
  }

  return [];
}

async function getDashboards(namespace) {
  const bool = {
    must: [{
      match: {
        type: 'dashboard',
      },
    }],
  };

  if (namespace !== 'default') {
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

async function getTasks (space, dashboards) {
  const bool = {
    must: [],
  };

  if (space !== 'default') {
    bool.must.push({
      match: {
        space,
      },
    });
  }

  if (space === 'default') {
    bool.must_not = {
      exists: {
        field: 'space',
      },
    };
  }

  try {
    const { body: data } = await elastic.search({
      index,
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
};

exports.list = async (ctx) => {
  logger.info('reporting/list');
  ctx.action = 'reporting/list';
  ctx.type = 'json';
  ctx.status = 200;

  const { space } = ctx.request.params;
  const { user, admin } = ctx.query;

  ctx.space = space;

  let isAdmin = false;
  try {
    const { body } = await client.security.getUser({
      username: user,
    });
    if (body && body[user]) {
      isAdmin = body[user].roles.includes('superuser') || body[user].roles.includes('admin');
    }
  } catch (e) {}

  let dashboards = [];
  let tasks = [];

  let spacesList = [space || 'default'];

  if (isAdmin && admin) {
    try {
      spacesList = await getSpaces();
    } catch (e) {}
  }

  if (spacesList) {
    for await (let space of spacesList) {
      let dashboardsData;
      try {
        dashboardsData = await getDashboards(space.name || space);
      } catch (err) {}

      dashboardsData.forEach(({ _id: dashId, _source: dashSource }) => {
        const dashboardId = dashId.split(':').pop();
        const dashboardTitle = dashSource && dashSource.dashboard && dashSource.dashboard.title;
        const dashboardDescription = dashSource && dashSource.dashboard && dashSource.dashboard.description;

        dashboards.push({
          id: dashboardId,
          name: dashboardTitle,
          description: dashboardDescription,
          namespace: space.name || space,
        });
      });

      try {
        const tasksData = await getTasks(space.name || space);

        tasksData.forEach((task) => {
          const { _source: hitSource, _id: hitId } = task;
          const dashboard = dashboards.find(({ id, namespace }) => id === hitSource.dashboardId && namespace === space.name || space);
 
          tasks.push({
            _id: hitId,
            dashboardId: hitSource.dashboardId,
            exists: !!dashboard,
            reporting: {
              frequency: hitSource.frequency,
              emails: hitSource.emails,
              print: hitSource.print,
              createdAt: hitSource.createdAt,
              sentAt: hitSource.sentAt,
              runAt: hitSource.runAt,
            },
            namespace: space.name || space,
          });
        });


      } catch (e) {
        tasks = [];
      }
    }
  }

  const body = {
    dashboards,
    tasks,
    frequencies,
  };

  if (isAdmin && admin) {
    body.spaces = spacesList;
  }

  ctx.body = body;
};

exports.store = async (ctx) => {
  logger.info('reporting/store');
  ctx.action = 'reporting/store';

  const { body } = ctx.request;
  const frequency = new Frequency(body.frequency);

  if (!frequency.isValid()) {
    ctx.throw(400, 'invalid frequency');
    return;
  }

  if (body.space === 'default' || body.space === '') {
    delete body.space;
  }

  const now = new Date();
  body.createdAt = now;
  body.updatedAt = now;
  body.sentAt = null;
  body.runAt = frequency.startOfnextPeriod(now);

  try {
    const { body: data } = await elastic.index({
      index,
      refresh: true,
      body,
    });
    const { _id: dataId } = data;

    ctx.taskId = dataId;

    ctx.metadata = await getMetadata(dataId);

    ctx.body = {
      _id: dataId,
      createdAt: body.createdAt,
      sentAt: body.sentAt,
      runAt: body.runAt,
    };
  } catch (err) {
    logger.error(err);
    ctx.status = 500;
  }

  ctx.status = 200;
};

exports.update = async (ctx) => {
  logger.info('reporting/update');
  ctx.action = 'reporting/update';

  const now = new Date();
  const { body } = ctx.request;
  const { taskId: id } = ctx.request.params;
  ctx.taskId = id;
  const frequency = new Frequency(body.frequency);

  if (!frequency.isValid()) {
    ctx.throw(400, 'invalid frequency');
    return;
  }

  try {
    await elastic.update({
      index,
      id,
      refresh: true,
      body: {
        doc: {
          ...body,
          runAt: frequency.startOfnextPeriod(now),
          updatedAt: now,
        },
      },
    });
  } catch (err) {
    logger.error(err);
    ctx.status = 500;
  }

  try {
    ctx.metadata = await getMetadata(id);
  } catch (e) {
    logger.error(e);
  }

  ctx.status = 204;
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
    return;
  }

  const { taskId: id } = ctx.request.params;
  ctx.taskId = id;

  try {
    ctx.metadata = await getMetadata(id);
  } catch (e) {
    logger.error(e);
  }

  try {
    await elastic.delete({
      id,
      refresh: true,
      index,
    });
  } catch (err) {
    logger.error(err);
    ctx.status = 500;
  }

  try {
    await elastic.deleteByQuery({
      index: historyIndex,
      refresh: true,
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

  ctx.type = 'json';
  ctx.status = 200;

  const { taskId: id } = ctx.request.params;
  ctx.taskId = id;

  if (!id) {
    ctx.status = 404;
    return;
  }

  try {
    const { body: data } = await elastic.search({
      index: historyIndex,
      timeout: '30s',
      body: {
        size: 10000,
        sort: {
          startTime: {
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

    const hits = data && data.hits && data.hits.hits;

    ctx.body = [];

    if (hits) {
      ctx.body = hits.map((historyItem) => {
        const { _source: historySource, _id: historyId } = historyItem;

        return {
          id: historyId,
          ...historySource,
        };
      });
    }
  } catch (err) {
    logger.error(err);
    ctx.status = 500;
  }
};

exports.download = async (ctx) => {
  const { taskId } = ctx.request.params;
  ctx.taskId = taskId;

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
    generateReport(task);
    ctx.status = 200;
  } catch (err) {
    logger.err(err);
    ctx.status(500);
  }
};
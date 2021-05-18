const {
  index,
  historyIndex,
  frequencies,
  reportingName,
} = require('config');
const logger = require('../../logger');
const elastic = require('../../services/elastic');
const { generateReport } = require('../../services/reporting');
const Frequency = require('../../services/frequency');

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

  ctx.space = space;

  let dashboardsData;
  try {
    dashboardsData = await getDashboards(space);
  } catch (err) {
    ctx.body = { tasks: [], dashboards: [], frequencies };
    logger.error(err);
    ctx.status = 500;
    return;
  }

  const dashboards = dashboardsData.map(({ _id: dashId, _source: dashSource }) => {
    const dashboardId = dashId.split(':').pop();
    const dashboardTitle = dashSource && dashSource.dashboard && dashSource.dashboard.title;

    return {
      id: dashboardId,
      name: dashboardTitle,
    };
  });

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

  const body = tasksData && tasksData.body;
  const hits = (body && body.hits && body.hits.hits) || [];

  const tasks = hits.map((hit) => {
    const { _source: hitSource, _id: hitId } = hit;
    const dashboard = dashboards.find(({ id }) => id === hitSource.dashboardId);

    return {
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
    };
  });

  ctx.body = {
    tasks,
    dashboards,
    frequencies,
    reportingName,
  };
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

  const now = new Date();
  body.createdAt = now;
  body.updatedAt = now;
  body.sentAt = null;
  body.runAt = frequency.startOfnextPeriod(now);

  try {
    const { body: data } = await elastic.index({ index, body });
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

    if (hits) {
      ctx.type = 'json';
      ctx.status = 200;

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

const parameters = {
  barChart: {
    description: 'A simple bar chart with embedded data.',
    height: 200,
    width: 400,
    data: {
      values: [
        { a: 'A', b: 28 }, { a: 'B', b: 55 }, { a: 'C', b: 43 },
        { a: 'D', b: 91 }, { a: 'E', b: 81 }, { a: 'F', b: 53 },
        { a: 'G', b: 19 }, { a: 'H', b: 87 },
      ],
    },
  },
  donut: {
    description: 'A basic pie chart example.',
    height: 200,
    width: 220,
    data: {
      values: [
        { category: 1, value: 4 },
        { category: 2, value: 6 },
        { category: 3, value: 10 },
        { category: 4, value: 3 },
        { category: 5, value: 7 },
        { category: 6, value: 8 },
      ],
    },
  },
  stackedBarChart: {
    description: 'A basic stacked bar chart example.',
    height: 190,
    width: 500,
    data: {
      values: [
        { a: 0, b: 28, color: 'blue' }, { a: 0, b: 55, color: 'orange' },
        { a: 1, b: 43, color: 'blue' }, { a: 1, b: 91, color: 'orange' },
        { a: 2, b: 81, color: 'blue' }, { a: 2, b: 53, color: 'orange' },
        { a: 3, b: 19, color: 'blue' }, { a: 3, b: 87, color: 'orange' },
        { a: 4, b: 52, color: 'blue' }, { a: 4, b: 48, color: 'orange' },
        { a: 5, b: 24, color: 'blue' }, { a: 5, b: 49, color: 'orange' },
        { a: 6, b: 87, color: 'blue' }, { a: 6, b: 66, color: 'orange' },
        { a: 7, b: 17, color: 'blue' }, { a: 7, b: 27, color: 'orange' },
        { a: 8, b: 68, color: 'blue' }, { a: 8, b: 16, color: 'orange' },
        { a: 9, b: 49, color: 'blue' }, { a: 9, b: 15, color: 'orange' },
      ],
    },
  },
};

exports.renderNotOptimized = async (ctx) => {
  await ctx.render('not-optimized', {
    etablissement: 'bibCNRS - NON OPTIMISÉ',
    parameters,
  });
};

exports.renderOptimized = async (ctx) => {
  await ctx.render('optimized', { etablissement: 'bibCNRS - OPTIMISÉ' });
};

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
  body.runAt = frequency.nextDateFrom(now);

  try {
    const { body: data } = await elastic.index({ index, body });
    const { _id: dataId } = data;

    ctx.body = {
      _id: dataId,
      createdAt: body.createdAt,
      sentAt: body.sentAt,
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
          runAt: frequency.nextDateFrom(now),
          updatedAt: now,
        },
      },
    });
  } catch (err) {
    logger.error(err);
    ctx.status = 500;
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
        const { _source: historySource, _id: historyId } = history;

        // FIXME: should be done with either moment or date-fns
        const match = /^([0-9]{4}-[0-9]{2}-[0-9]{2})T([0-9]{2}:[0-9]{2}:[0-9]{2}).([0-9]{3})Z$/i.exec(historySource.createdAt);
        const date = match ? match[1] : historySource.createdAt;

        histories.push({
          value: historyId,
          text: date,
        });

        historiesData.push({
          id: historyId,
          ...historySource,
        });
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
    generateReport(task);
    ctx.status = 200;
  } catch (err) {
    logger.err(err);
    ctx.status(500);
  }
};

const { index, frequencies } = require('config');
const logger = require('../../logger');
const elastic = require('../../services/elastic');
const puppeteer = require('../../services/puppeteer');
const indexTemplate = require('../../utils/reporting-template');

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

  const { space } = ctx;

  const dashboards = [];
  const tasks = [];

  let dashboardsData;

  const { body: exists } = await elastic.indices.exists({ index });
  if (!exists) {
    try {
      await elastic.indices.create({
        index,
        body: indexTemplate,
      });
    } catch (err) {
      logger.error(err);
      ctx.status = 500;
      return ctx;
    }
  }

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
      if (dashboard) {
        tasks.push({
          _id: hits[i]._id,
          dashboardId: hits[i]._source.dashboardId,
          reporting: {
            frequency: hits[i]._source.frequency,
            emails: hits[i]._source.emails,
            print: hits[i]._source.print,
            createdAt: hits[i]._source.createdAt,
          },
        });
      }
    }
  }

  ctx.body = { tasks, dashboards, frequencies };
};

exports.store = async (ctx) => {
  logger.info('reporting/store');
  ctx.action = 'reporting/store';
  ctx.status = 200;

  if (ctx.invalid) {
    const invalidBody = ctx.invalid.body;
    const errors = invalidBody.details.map(({ message }) => message);
    ctx.body = errors;
    return ctx;
  }

  const { body } = ctx.request;

  body.createdAt = new Date();
  body.updatedAt = new Date();

  try {
    const { body: data } = await elastic.index({
      index,
      body,
    });

    ctx.body = {
      _id: data._id,
      createdAt: body.createdAt,
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
};

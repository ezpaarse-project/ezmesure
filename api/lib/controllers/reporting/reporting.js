const elastic = require('../../services/elastic');
const indexTemplate = require('../../utils/reporting-template');

const index = '.ezmesure-reporting';

async function getDashboards (namespace) {
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
  }
  
  if (!namespace) {
    bool['must_not'] = {
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
      return data.hits.hits
    }
  } catch (err) {
    console.log(err);
    return [];
  }

  return [];
}

exports.list = async (ctx, space) => {
  ctx.action = 'reporting/list';
  ctx.type = 'json';
  ctx.status = 200;

  const dashboards = [];
  const reporting = [];

  let dashboardsData;

  try {
    dashboardsData = await getDashboards(space);
  } catch (err) {
    ctx.status = 500;
    return ctx.body = { reporting, dashboards };
  }

  for (let i = 0; i < dashboardsData.length; i += 1) {
    const element = dashboardsData[i];
    const dashboardId = element._id.split(':');

    dashboards.push({
      value: dashboardId[dashboardId.length - 1],
      text: element._source.dashboard.title,
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
    bool['must_not'] = {
      exists: {
        field: 'space',
      },
    };
  }

  let tasks;
  try {
    tasks = await elastic.search({
      index,
      timeout: '30s',
      body: {
        query: {
          bool,
        },
      },
    });
  } catch (err) {
    console.log(err);
    ctx.status = 500;
  }

  if (tasks) {
    const { hits } = tasks.body.hits;

    for (let i = 0; i < hits.length; i += 1) {
      const dashboard = dashboards.find(({ value }) => value === hits[i]._source.dashboardId);
      if (dashboard) {
        reporting.push({
          _id: hits[i]._id,
          dashboard,
          reporting: {
            frequency: hits[i]._source.frequency,
            emails: hits[i]._source.emails,
            createdAt: hits[i]._source.createdAt,
          }
        });
      }
    }
  }

  ctx.body = { reporting, dashboards };
};

exports.store = async ctx => {
  ctx.action = 'reporting/store';
  ctx.status = 200;

  const { body: exists } = await elastic.indices.exists({ index });
  if (!exists) {
    try {
      await elastic.indices.create({
        index,
        body: indexTemplate
      });
    } catch (err) {
      console.log(err);
      return ctx.status = 500;
    }
  }

  const validator = {
    dashboardId: {
      required: true,
      nullable: false,
    },
    space: {
      required: false,
    },
    frequency: {
      required: true,
      nullable: false,
    },
    emails: {
      required: true,
      nullable: false,
      regex: /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/i,
    },
  };

  const body = ctx.request.body;
  const errors = [];

  // Object.keys(body).forEach(data => {
  //   if (!validator[data].required) errors.push(`${data} is required`);
  //   if (!validator[data].nullable) {
  //     if (body[data].length <= 0 || body[data === null]) errors.push(`${data} cannot be null`);
  //   }

  //   if (validator[data].regex) {
  //     if (!validator[data].regex.test(body[data])) errors.push(`Enter a valid email list`);
  //   }
  // });

  if (errors.length > 0) {
    ctx.status = 400;
    ctx.body = errors;
    return ctx;
  }

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
    console.log(err);
    ctx.status = 500;
  }
};

exports.update = async (ctx, id) => {
  ctx.action = 'reporting/update';
  ctx.status = 204;

  const body = ctx.request.body;

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
    }).then(res => res.body);
  } catch (err) {
    console.log(err);
    ctx.status = 500;
  }
};

exports.del = async (ctx, id) => {
  ctx.action = 'reporting/delete';
  ctx.status = 204;
  
  try {
    await elastic.delete({
      id,
      index,
    }).then(res => res.body);
  } catch (err) {
    console.log(err);
    ctx.status = 500;
  }
};


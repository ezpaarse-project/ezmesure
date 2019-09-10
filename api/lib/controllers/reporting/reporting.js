const elastic = require('../../services/elastic');
const indexTemplate = require('../../utils/reporting-template');

const index = '.ezmesure-reporting';

exports.list = async (ctx, space) => {
  ctx.action = 'reporting/list';
  ctx.type = 'json';
  ctx.status = 200;

  const dashboards = [];
  const reporting = [];

  let dashboardsData = await elastic.dashboard.findAll();
  dashboardsData.hits.forEach(element => {
    if (element._source.namespace === space) {
      dashboards.push({
        value: element._id.split(':')[1],
        text: element._source.dashboard.title,
      });
    }
  });

  try {
    for (let i = 0; i < dashboards.length; i += 1) {
      const { body: result } = await elastic.search({
        index,
        timeout: '30s',
        body: {
          query: {
            bool: {
              must: [
                {
                  match: {
                    space: space || 'NULL',
                  },
                },
                {
                  match: {
                    dashboardId: dashboards[i].value,
                  },
                },
              ],
            },
          },
        },
      });

      if (result) {
        const { hits } = result.hits;
        for (let i = 0; i < hits.length; i += 1) {
          const dashboard = dashboards.find(({ value }) => value === hits[i]._source.dashboardId);
          if (dashboard) {
            reporting.push({
              id: hits[i]._id,
              dashboard,
              reporting: {
                timeSpan: hits[i]._source.timeSpan,
                emails: hits[i]._source.emails,
              }
            })
          }
        }
      }
    }
  } catch (err) {
    console.log(err)
  }
console.log(reporting)
  ctx.body = { reporting, dashboards };
};

exports.store = async ctx => {
  ctx.action = 'reporting/store';
  ctx.status = 200;

  const { body: exists } = await elastic.indices.exists({ index });
  if (!exists) {
    await elastic.indices.create({
      index,
      body: indexTemplate
    });
  }

  const validator = {
    user: {
      required: true,
      nullable: false,
    },
    dashboardId: {
      required: true,
      nullable: false,
    },
    space: {
      required: true,
      nullable: true,
    },
    timeSpan: {
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

  Object.keys(body).forEach(data => {
    if (!validator[data].required) errors.push(`${data} is required`);
    if (!validator[data].nullable) {
      if (body[data].length <= 0 || body[data === null]) errors.push(`${data} cannot be null`);
    }

    if (validator[data].regex) {
      if (!validator[data].regex.test(body[data])) errors.push(`Enter a valid email list`);
    }
  });

  if (errors.length > 0) {
    ctx.status = 400;
    return ctx.body = errors;
  }

  return elastic.index({
    index,
    body,
  }).then(res => res.body);
};

exports.update = (ctx, id) => {
  ctx.action = 'reporting/update';
  ctx.status = 200;
};

exports.del = (ctx, id) => {
  ctx.action = 'reporting/delete';
  // ctx.status = 200;
  // DELETE data in index by id
};


const get = require('lodash.get');
const elastic = require('../../services/elastic');
const logger = require('../../logger');

exports.getAll = async (ctx) => {
  logger.info('reporting/list');
  ctx.action = 'reporting/list';
  ctx.type = 'json';
  ctx.status = 200;

  let spacesSource = [];
  try {
    const { body } = await elastic.search({
      index: '.kibana',
      timeout: '30s',
      body: {
        size: 10000,
        query: {
          bool: {
            must: [
              {
                match: {
                  type: 'space',
                },
              },
            ],
          },
        },
      },
    });

    spacesSource = get(body, 'hits.hits');
  } catch (error) {
    ctx.status = 500;
    ctx.body = [];
  }

  let spaces = [];
  if (spacesSource.length > 0) {
    spaces = spacesSource.map(({ _id: id, _source: source }) => ({
      id,
      name: id.split(':').pop(),
      color: source.space.color || '#00bfb3',
    }));
  }

  ctx.body = spaces;
};

const elastic = require('./elastic');
const indexTemplate = require('../utils/metrics-template');

const index = '.ezmesure-metrics';

exports.save = async function (body) {
  const exists = await elastic.indices.exists({ index });

  if (!exists) {
    await elastic.indices.create({
      index,
      body: indexTemplate
    });
  }

  return elastic.index({
    index: '.ezmesure-metrics',
    type: '_doc',
    body
  });
};

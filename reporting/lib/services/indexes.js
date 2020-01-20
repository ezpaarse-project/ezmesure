const { index, historyIndex } = require('config');
const elastic = require('./elastic');
const indexTemplate = require('../utils/reporting-template');
const historyTemplate = require('../utils/history-template');
const logger = require('../logger');

function createIndex(indexName, template) {
  return elastic.indices.create({
    index: indexName,
    body: template,
  });
}

module.exports = {
  findOrCreate: async () => {
    try {
      const { body: indexExists } = await elastic.indices.exists({ index });
      if (!indexExists) {
        logger.warn(`Index : ${index} not found`);
        await createIndex(index, indexTemplate);
        logger.info(`Index : ${index} created`);
      }
      if (indexExists) {
        logger.info(`Index : ${index} exists`);
      }

      const { body: historyExists } = await elastic.indices.exists({ index: historyIndex });
      if (!historyExists) {
        logger.warn(`Index : ${historyIndex} not found`);
        await createIndex(historyIndex, historyTemplate);
        logger.info(`Index : ${historyIndex} created`);
      }
      if (historyExists) {
        logger.info(`Index : ${historyIndex} exists`);
      }
    } catch (e) {
      logger.error(e);
    }
  },
};

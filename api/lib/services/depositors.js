const config = require('config');

const elastic = require('./elastic');
const { appLogger } = require('../../server');

const { index } = config.get('depositors');

const crypto = require('../services/crypto');

elastic.indices.exists({ index })
  .then(({ body: exists }) => {
    if (!exists) { job.fireOnTick(); }
  })
  .catch((err) => {
    appLogger.error(`Failed to check depositors index existence : ${err.statusCode} | ${err.message}`);
  });

/**
 * Get depositors from the index
 */
async function getFromIndex() {
  const { body } = await elastic.search({
    index,
    size: 1000,
    ignoreUnavailable: true,
  });

  if (!body || !body.hits || !body.hits.hits) {
    throw new Error('invalid elastic response');
  }

  const depositors = body.hits.hits.map((hit) => {
    const depositor = hit._source;

    if (!depositor) {
      return {};
    }

    depositor.id = hit._id;

    if (!depositor.contacts.length) {
      depositor.contacts = {};
    }

    if (depositor.sushi.length) {
      for (let i = 0; i < depositor.sushi.length; i += 1) {
        depositor.sushi[i].customerId = crypto.decrypt(depositor.sushi[i].customerId);
        depositor.sushi[i].requestorId = crypto.decrypt(depositor.sushi[i].requestorId);
      }
    }

    return depositor;
  });

  return depositors;
}

module.exports = {
  getFromIndex,
};

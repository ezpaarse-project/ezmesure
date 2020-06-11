const config = require('config');

const elastic = require('./elastic');

const { index } = config.get('depositors');
const encrypter = require('../services/encrypter');

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
    const { _source: depositor, _id: id } = hit;

    if (!depositor) {
      return {};
    }

    depositor.id = id;

    if (!Array.isArray(depositor.contacts)) {
      depositor.contacts = [];
    }

    if (depositor.sushi.length) {
      for (let i = 0; i < depositor.sushi.length; i += 1) {
        depositor.sushi[i].customerId = encrypter.decrypt(depositor.sushi[i].customerId);
        depositor.sushi[i].requestorId = encrypter.decrypt(depositor.sushi[i].requestorId);
      }
    }

    return depositor;
  });

  return depositors;
}

module.exports = {
  getFromIndex,
};

const config = require('config');

const elastic = require('./elastic');
const { appLogger } = require('../../server');

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

    if (Array.isArray(depositor.sushi)) {
      depositor.sushi = depositor.sushi.map((sushiItem) => {
        const decrypted = sushiItem;

        try {
          decrypted.customerId = encrypter.decrypt(decrypted.customerId);
          decrypted.requestorId = encrypter.decrypt(decrypted.requestorId);
        } catch (e) {
          appLogger.error(`Failed to decrypt Sushi item: ${e.message}`);
        }

        return decrypted;
      });
    }

    return depositor;
  });

  return depositors;
}

module.exports = {
  getFromIndex,
};

const elastic = require('./elastic');
const { roleName, index, historyIndex } = require('config');
const logger = require('../logger');

const createRole = (name, privileges) => {
  return elastic.security.putRole({
    name,
    body: {
      cluster: [],
      indices: [
        {
          names: [index, historyIndex],
          privileges,
        },
      ],
    },
  });
};

module.exports = {
  findOrCreate: async () => {
    try {
      await elastic.security.getRole({ name: roleName });
      logger.info(`Role : ${roleName} exists`);
    } catch (err) {
      if (err && err.meta && err.meta.statusCode === 404) {
        logger.warn(`Role : ${roleName} not found`);
        await createRole(roleName, ['read', 'write', 'create', 'delete']);
        logger.info(`Role : ${roleName} created`);
      }
    }

    try {
      await elastic.security.getRole({ name: `${roleName}_read_only` });
      logger.info(`Role : ${roleName}_read_only exists`);
    } catch (err) {
      if (err && err.meta && err.meta.statusCode === 404) {
        logger.warn(`Role : ${roleName}_read_only not found`);
        await createRole(`${roleName}_read_only`, ['read']);
        logger.info(`Role : ${roleName}_read_only created`);
      }
    }
  },
};

/* eslint-disable no-console */
const { parseArgs } = require('node:util');

let { client } = require('../../lib/services/prisma');

const { values: args } = parseArgs({
  options: {
    'dry-run': {
      type: 'boolean',
      default: false,
    },
  },
});

if (args['dry-run']) {
  const proxify = (previous = []) => new Proxy(() => { }, {
    get: (_, field) => proxify([...previous, field]),

    apply: (_, __, params) => {
      console.group();
      console.log(`Calling \x1b[4m${previous.join('.')}\x1b[0m(`, ...params, ')');
      console.groupEnd();
      return 0;
    },
  });

  client = proxify();
}

module.exports = {
  client,
};

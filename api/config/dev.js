const defaultConfig = require('./default');

module.exports = {
  ...defaultConfig,
  logs: {
    app: {
      Console: {
        level: 'verbose',
      },
      Buffered: {
        level: 'verbose',
      },
    },
  },
};

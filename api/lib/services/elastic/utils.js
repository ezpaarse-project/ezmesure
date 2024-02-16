// const indices = require('./indices');
const users = require('./users');

async function resetElastic() {
  if (process.env.NODE_ENV !== 'dev') { return null; }

  // FIXME: https://github.com/elastic/kibana/issues/119704
  // await indices.removeAll();
  await users.removeAll();
}

module.exports = {
  resetElastic,
};

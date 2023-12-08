const indices = require('./indices');
const users = require('./users');

async function resetElastic() {
  if (process.env.NODE_ENV !== 'dev') { return null; }

  await indices.removeAll();
  await users.removeAll();
}

module.exports = {
  resetElastic,
};

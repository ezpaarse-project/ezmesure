const indices = require('./indices');
const users = require('./users');

async function resetElastic() {
  if (process.env.NODE_ENV === 'production') { return null; }

  await indices.removeAll();
  await users.removeAll();
}

module.exports = {
  resetElastic,
};

const institutions = require('./institutions');
const memberships = require('./memberships');
const repositories = require('./repositories');
const repositoryPermissions = require('./repository-permissions');
const spaces = require('./spaces');
const harvestJobs = require('./harvest-job');
const sushiCredentials = require('./sushi-credentials');
const sushiEndpoints = require('./sushi-endpoints');
const users = require('./users');

async function resetDatabase() {
  if (process.env.NODE_ENV !== 'dev') { return null; }

  await harvestJobs.removeAll();
  await institutions.removeAll();
  await memberships.removeAll();
  await repositories.removeAll();
  await repositoryPermissions.removeAll();
  await spaces.removeAll();
  await sushiCredentials.removeAll();
  await sushiEndpoints.removeAll();
  await users.removeAll();
}

module.exports = {
  resetDatabase,
};

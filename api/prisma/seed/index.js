// @ts-check
/* eslint-disable no-console */

const { createUsers } = require('./users');
const { createEndpoints } = require('./counter');
const { createInstitutions } = require('./institutions');
const { createRepositories } = require('./repositories');
const { createDashboards } = require('./dashboards');
const { createSpaces } = require('./spaces');

// #region Utils

/** @param {string} text */
const gray = (text) => `\x1b[90m${text}\x1b[0m`;
/** @param {string} text */
const green = (text) => `\x1b[32m${text}\x1b[0m`;
/** @param {string} text */
const red = (text) => `\x1b[31m${text}\x1b[0m`;

// #endregion

// #region Entrypoint

async function main() {
  console.log(gray('Creating users...'));
  console.log(green(`Created ${await createUsers()} users`));

  console.log(gray('Creating endpoints...'));
  console.log(green(`Created ${await createEndpoints()} endpoints`));

  console.log(gray('Creating institutions...'));
  console.log(green(`Created ${await createInstitutions()} institutions`));

  console.log(gray('Creating repositories...'));
  console.log(green(`Created ${await createRepositories()} repositories`));

  console.log(gray('Creating dashboards...'));
  console.log(green(`Created ${await createDashboards()} dashboards`));

  console.log(gray('Creating spaces...'));
  console.log(green(`Created ${await createSpaces()} spaces`));
}

// #endregion

main()
  .catch(async (e) => {
    console.error(red(e));
    process.exit(1);
  });

const config = require('config');
const { pick } = require('lodash');

exports.getConfig = async (ctx) => {
  ctx.type = 'json';
  ctx.status = 200;
  ctx.body = pick(config, [
    'instanceName',
    'homepage.features',
    'homepage.logos',
    'counter.registryUrl',
    'auth.profileUri',
    'users.deleteDurationDays',
    'users.impersonateDuration',
  ]);
};

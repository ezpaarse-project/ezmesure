const elastic = require('../../services/elastic');

const { generateUsernameFromApiKey } = require('../../hooks/utils');

/**
 * Extract username suitable for Elastic from user or api key
 *
 * @param {import('koa').Context} ctx - The Koa context
 *
 * @returns {string} A username ready to be used for Elasticsearch requests
 */
const getElasticUsername = (ctx) => {
  const { user, authData } = ctx.state ?? {};
  if (user?.username) {
    return user.username;
  }

  return generateUsernameFromApiKey(authData.data);
};

/**
 * Check privileges of user to do an action on an index
 *
 * @param {string} index - The target index
 * @param {string} privilege - The target privilege
 * @param {string} username - The user we want to check
 *
 * @returns {Promise<boolean>} If the specified user have the rights to do specified action
 */
const hasElasticPermission = async (index, privilege, username) => {
  const { body: perm } = await elastic.security.hasPrivileges(
    {
      username,
      body: {
        index: [{ names: [index], privileges: [privilege] }],
      },
    },
    { headers: { 'es-security-runas-user': username } },
  );

  return !!perm?.index?.[index]?.[privilege];
};

module.exports = {
  getElasticUsername,
  hasElasticPermission,
};

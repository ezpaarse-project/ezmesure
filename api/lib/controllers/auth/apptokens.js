const { signJWT } = require('../../utils/jwt');

module.exports.generateAppToken = (user) => {
  if (!user) { return null; }

  const { username, email } = user;
  return signJWT({ username, email });
};

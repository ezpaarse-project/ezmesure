const jwt = require('jsonwebtoken');

const config = require('config');

const secret = config.get('auth.secret');

module.exports.generateAppToken = (user) => {
  if (!user) { return null; }

  const { username, email } = user;
  return jwt.sign({ username, email }, secret);
};

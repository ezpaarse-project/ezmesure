const jwt = require('jsonwebtoken');

const { auth } = require('config');

module.exports.generateAppToken = (user) => {
  if (!user) { return null; }

  const { username, email } = user;
  return jwt.sign({ username, email }, auth.secret);
};

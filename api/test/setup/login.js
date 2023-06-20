const config = require('config');
const ezmesure = require('./ezmesure');

const usernameAdmin = config.get('admin.username');
const passwordAdmin = config.get('admin.password');

async function login(username, password) {
  let res;

  try {
    res = await ezmesure({
      method: 'POST',
      url: '/login/local',
      data: {
        username,
        password,
      },
    });
  } catch (err) {
    console.error(err?.response?.data);
    return;
  }

  let token = res?.headers['set-cookie'][0];
  const match = /^eztoken=([a-zA-Z0-9_.-]+);/i.exec(token);
  [, token] = match;
  return token;
}

async function getAdminToken() {
  return login(usernameAdmin, passwordAdmin);
}

module.exports = {
  login,
  getAdminToken,
};

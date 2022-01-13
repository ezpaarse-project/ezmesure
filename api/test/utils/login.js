const ezmesure = require('./ezmesure');

const login = async (username, password) => {
  let res;

  try {
    res = await ezmesure({
      method: 'post',
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
};

module.exports = login;

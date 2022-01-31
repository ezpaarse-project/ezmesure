const ezmesure = require('./ezmesure');

const login = async (username, password) => {
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
};

const createUser = async (username, password) => {
  let res;

  const token = await login('ezmesure-admin', 'changeme');

  try {
    res = await ezmesure({
      method: 'PUT',
      url: `/users/${username}`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: {
        username,
        enabled: true,
        email: 'user@test.fr',
        full_name: 'User test',
        metadata: {},
        password,
        roles: [],
      },
    });
  } catch (err) {
    console.error(err?.response?.data);
    return;
  }
  return res?.data?.created;
};

const deleteUser = async (username) => {
  const token = await login('ezmesure-admin', 'changeme');

  let res;

  try {
    res = await ezmesure({
      method: 'DELETE',
      url: `/users/${username}`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (err) {
    console.error(err?.response?.data);
    return;
  }
  return res?.status === 204;
};

module.exports = {
  login,
  createUser,
  deleteUser,
};

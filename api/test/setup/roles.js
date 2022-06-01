const ezmesure = require('./ezmesure');

const login = require('./login');

const createRole = async (roleName, indices) => {
  const token = await login('ezmesure-admin', 'changeme');
  let res;
  try {
    res = await ezmesure({
      method: 'PUT',
      url: `/roles/${roleName}`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: {
        elasticsearch: {
          indices,
        },
      },
    });
  } catch (err) {
    console.error(err?.response?.data);
    return;
  }
  return res?.data;
};

const deleteRole = async (roleName) => {
  const token = await login('ezmesure-admin', 'changeme');
  let res;
  try {
    res = await ezmesure({
      method: 'DELETE',
      url: `/roles/${roleName}`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (err) {
    console.error(err?.response?.data);
    return;
  }
  return res?.data;
};

module.exports = {
  createRole,
  deleteRole,
};

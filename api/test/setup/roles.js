const ezmesure = require('./ezmesure');

const login = require('./login');

const createRoleAsAdmin = async (roleName, indices) => {
  const token = await login('ezmesure-admin', 'changeme');
  return ezmesure({
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
};

const deleteRoleAsAdmin = async (roleName) => {
  const token = await login('ezmesure-admin', 'changeme');
  return ezmesure({
    method: 'DELETE',
    url: `/roles/${roleName}`,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

module.exports = {
  createRoleAsAdmin,
  deleteRoleAsAdmin,
};

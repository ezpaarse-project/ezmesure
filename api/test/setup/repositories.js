const ezmesure = require('./ezmesure');
const { getAdminToken } = require('./login');

async function createRepositoryAsAdmin(data) {
  const adminToken = await getAdminToken();

  const res = await ezmesure({
    method: 'POST',
    url: '/repositories',
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
    data,
  });
  return res?.data?.pattern;
}

async function deleteRepositoryAsAdmin(pattern) {
  const adminToken = await getAdminToken();

  return ezmesure({
    method: 'DELETE',
    url: `/repositories/${pattern}`,
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
  });
}

async function addPermissionToRepositoryAsAdmin(pattern, username, permissions) {
  const adminToken = await getAdminToken();

  return ezmesure({
    method: 'PUT',
    url: `/repositories/${pattern}/permissions/${username}`,
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
    data: permissions,
  });
}

async function deletePermissionToRepositoryAsAdmin(pattern, username) {
  const adminToken = await getAdminToken();

  return ezmesure({
    method: 'DELETE',
    url: `/repositories/${pattern}/permissions/${username}`,
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
  });
}

module.exports = {
  createRepositoryAsAdmin,
  deleteRepositoryAsAdmin,
  addPermissionToRepositoryAsAdmin,
  deletePermissionToRepositoryAsAdmin,
};

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
  return res?.data?.id;
}

async function deleteRepositoryAsAdmin(repositoryId) {
  const adminToken = await getAdminToken();

  return ezmesure({
    method: 'DELETE',
    url: `/repositories/${repositoryId}`,
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
  });
}

async function addPermissionToRepositoryAsAdmin(repositoryId, username, permissions) {
  const adminToken = await getAdminToken();

  return ezmesure({
    method: 'PUT',
    url: `/repositories/${repositoryId}/permissions/${username}`,
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
    data: permissions,
  });
}

async function deletePermissionToRepositoryAsAdmin(repositoryId, username) {
  const adminToken = await getAdminToken();

  return ezmesure({
    method: 'DELETE',
    url: `/repositories/${repositoryId}/permissions/${username}`,
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

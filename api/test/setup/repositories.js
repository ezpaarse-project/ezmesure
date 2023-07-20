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

module.exports = {
  createRepositoryAsAdmin,
  deleteRepositoryAsAdmin,
};

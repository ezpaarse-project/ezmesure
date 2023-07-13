const ezmesure = require('./ezmesure');

const { getAdminToken } = require('./login');

async function createSpaceAsAdmin(spaceConfig) {
  const adminToken = await getAdminToken();

  return ezmesure({
    method: 'POST',
    url: '/kibana-spaces',
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
    data: spaceConfig,
  });
}

async function deleteSpaceAsAdmin(id) {
  const token = await getAdminToken();

  return ezmesure({
    method: 'DELETE',
    url: `/kibana-spaces/${id}`,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

module.exports = { createSpaceAsAdmin, deleteSpaceAsAdmin };

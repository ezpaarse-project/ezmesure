const ezmesure = require('./ezmesure');
const { getAdminToken } = require('./login');

async function createSushiEndpointAsAdmin(sushiConfig) {
  const adminToken = await getAdminToken();
  const res = await ezmesure({
    method: 'POST',
    url: '/sushi-endpoints/',
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
    data: sushiConfig,
  });

  return res?.data?.id;
}

async function deleteSushiEndpointAsAdmin(sushiEndpointId) {
  const adminToken = await getAdminToken();

  return ezmesure({
    method: 'DELETE',
    url: `/sushi-endpoints/${sushiEndpointId}`,
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
  });
}

module.exports = {
  createSushiEndpointAsAdmin,
  deleteSushiEndpointAsAdmin,
};

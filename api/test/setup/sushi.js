const ezmesure = require('./ezmesure');
const { getAdminToken } = require('./login');

async function createSushiAsAdmin(sushiConfig) {
  const adminToken = await getAdminToken();

  const res = await ezmesure({
    method: 'POST',
    url: '/sushi',
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
    data: sushiConfig,
  });
  return res?.data?.id;
}

async function deleteSushiAsAdmin(id) {
  const adminToken = await getAdminToken();

  return ezmesure({
    method: 'DELETE',
    url: `/sushi/${id}`,
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
  });
}

module.exports = {
  createSushiAsAdmin,
  deleteSushiAsAdmin,
};

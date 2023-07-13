const ezmesure = require('./ezmesure');
const { getAdminToken } = require('./login');

async function createRepositoryAsAdmin(data) {
  const token = await getAdminToken();

  const res = await ezmesure({
    method: 'POST',
    url: '/repositories',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    data,
  });
  return res?.data?.id;
}

module.exports = createRepositoryAsAdmin;

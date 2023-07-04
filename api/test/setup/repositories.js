const ezmesure = require('./ezmesure');
const { getAdminToken } = require('./login');

async function createRepositoryAsAdmin(data) {
  let res;

  const token = await getAdminToken();

  try {
    res = await ezmesure({
      method: 'POST',
      url: '/repositories',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data,
    });
  } catch (err) {
    res = err?.response;
    return;
  }
  return res?.data?.id;
}

module.exports = createRepositoryAsAdmin;

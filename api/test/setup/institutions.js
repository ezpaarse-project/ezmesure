const ezmesure = require('./ezmesure');
const { getAdminToken } = require('./login');

async function createInstitutionAsAdmin(data) {
  let res;

  const token = await getAdminToken();

  try {
    res = await ezmesure({
      method: 'POST',
      url: '/institutions/',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data,
    });
  } catch (err) {
    console.error(err?.response?.data);
    return;
  }
  return res?.data?.id;
}
async function deleteInstitutionAsAdmin(id) {
  let res;

  const token = await getAdminToken();

  try {
    res = await ezmesure({
      method: 'DELETE',
      url: `/institutions/${id}`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (err) {
    res = err?.response;
    return;
  }
  return res?.status;
}

module.exports = {
  createInstitutionAsAdmin,
  deleteInstitutionAsAdmin,
};

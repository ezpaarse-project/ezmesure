const ezmesure = require('./ezmesure');
const { getToken, getAdminToken } = require('./login');

async function createInstitution(data, user) {
  let res;

  const token = await getToken(user.username, user.password);

  try {
    res = await ezmesure({
      method: 'POST',
      url: '/institutions',
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

async function createInstitutionAsAdmin(data) {
  let res;

  const token = await getAdminToken();

  try {
    res = await ezmesure({
      method: 'POST',
      url: '/institutions',
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
  createInstitution,
  createInstitutionAsAdmin,
  deleteInstitutionAsAdmin,
};

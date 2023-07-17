const ezmesure = require('./ezmesure');
const { getToken, getAdminToken } = require('./login');

async function createInstitution(data, user) {
  const token = await getToken(user.username, user.password);

  const res = await ezmesure({
    method: 'POST',
    url: '/institutions',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    data,
  });

  return res?.data?.id;
}

async function createInstitutionAsAdmin(data) {
  const token = await getAdminToken();

  const res = await ezmesure({
    method: 'POST',
    url: '/institutions',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    data,
  });

  return res?.data?.id;
}

async function deleteInstitutionAsAdmin(id) {
  const token = await getAdminToken();

  return ezmesure({
    method: 'DELETE',
    url: `/institutions/${id}`,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

async function addMemberShipsAsAdmin(institutionId, username, roles) {
  const adminToken = await getAdminToken();
  let res;
  try {
    res = await ezmesure({
      method: 'PUT',
      url: `/institutions/${institutionId}/memberships/${username}`,
      data: {
        roles,
      },
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });
  } catch (err) {
    res = err?.response;
  }
  return res.status;
}

async function addPermissionsToUserAsAdmin(institutionId, username, permissions) {
  const adminToken = await getAdminToken();

  return ezmesure({
    method: 'PUT',
    url: `/institutions/${institutionId}/memberships/${username}`,
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
    data: {
      permissions,
    },
  });
}

async function deletePermissionsToUserAsAdmin(institutionId, username) {
  const adminToken = await getAdminToken();

  return ezmesure({
    method: 'DELETE',
    url: `/institutions/${institutionId}/memberships/${username}`,
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
  });
}

module.exports = {
  createInstitution,
  createInstitutionAsAdmin,
  deleteInstitutionAsAdmin,
  addMemberShipsAsAdmin,
  addPermissionsToUserAsAdmin,
  deletePermissionsToUserAsAdmin,
};

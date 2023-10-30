const ezmesure = require('./ezmesure');

const { getAdminToken } = require('./login');

const createIndexAsAdmin = async (indexName) => {
  const token = await getAdminToken();
  return ezmesure({
    method: 'PUT',
    url: `/indices/${indexName}`,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

const deleteIndexAsAdmin = async (indexName) => {
  const token = await getAdminToken();
  return ezmesure({
    method: 'DELETE',
    url: `/indices/${indexName}`,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

module.exports = {
  createIndexAsAdmin,
  deleteIndexAsAdmin,
};

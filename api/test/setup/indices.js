const ezmesure = require('./ezmesure');

const { getAdminToken } = require('./login');

const createIndexAsAdmin = async (indexName) => {
  const token = await getAdminToken();
  let res;
  try {
    await ezmesure({
      method: 'PUT',
      url: `/indices/${indexName}`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (err) {
    res = err?.response;
    return;
  }
  return res?.data?.created;
};

const deleteIndexAsAdmin = async (indexName) => {
  const token = await getAdminToken();
  let res;
  try {
    res = await ezmesure({
      method: 'DELETE',
      url: `/indices/${indexName}`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (err) {
    res = err?.response;
    return;
  }
  return res?.status === 204;
};

module.exports = {
  createIndexAsAdmin,
  deleteIndexAsAdmin,
};

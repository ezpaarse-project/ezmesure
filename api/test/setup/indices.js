const ezmesure = require('./ezmesure');

const login = require('./login');

const createIndex = async (indexName) => {
  const token = await login('ezmesure-admin', 'changeme');
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
    console.error(err?.response?.data);
    return;
  }
  return res?.data?.created;
};

const deleteIndex = async (indexName) => {
  const token = await login('ezmesure-admin', 'changeme');
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
    // console.error(err?.response?.data);
    return;
  }
  return res?.status === 204;
};

module.exports = {
  createIndex,
  deleteIndex,
};

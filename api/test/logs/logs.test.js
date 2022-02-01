const path = require('path');
const fs = require('fs-extra');

const ezmesure = require('../utils/ezmesure');

const login = require('../utils/login');
const { createIndex, deleteIndex } = require('../utils/indices');
const { createUser, deleteUser } = require('../utils/users');
const { createRole, deleteRole } = require('../utils/roles');

describe('oooh', () => {
  describe('GET /indices/index-test - get indice "index-test" with user01 token', () => {
    let userToken;
    let adminToken;
    beforeAll(async () => {
      adminToken = await login('ezmesure-admin', 'changeme');
      await createUser('user01', 'password', ['role-test']);
      userToken = await login('user01', 'password');
      await createIndex('index-test');
      await createRole('role-test', [{ names: ['index-test'], privileges: ['all'] }]);
    });

    it('Should get HTTP status 200', async () => {
      const pathFile = path.resolve(__dirname, '..', 'sources', 'wiley.csv');

      let res;
      try {
        res = await ezmesure({
          method: 'POST',
          url: '/logs/index-test',
          data: await fs.readFile(pathFile, 'utf-8'),
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        });
      } catch (err) {
        res = err?.response;
      }

      console.log(res?.data);

      expect(res).toHaveProperty('status', 200);
    });

    afterAll(async () => {
      await deleteUser('user01');
      await deleteIndex('index-test');
      await deleteRole('role-test');
    });
  });
});

// TODO droit

// TODO corrupted file

// TODO existing columun

// TODO 2 post, second file updated

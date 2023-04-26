const ezmesure = require('../setup/ezmesure');

const login = require('../setup/login');
const { createUser, deleteUser } = require('../setup/users');
const { createRole, deleteRole } = require('../setup/roles');
const { createIndex, deleteIndex } = require('../setup/indices');

describe('oooh', () => {
  describe('GET /indices/index-test - get indice "index-test" with user01 token', () => {
    let userToken;
    beforeAll(async () => {
      await createUser('user01', 'password', ['role-test']);
      userToken = await login('user01', 'password');
      await createIndex('index-test');
      await createRole('role-test', [{ names: ['index-test'], privileges: ['all'] }]);
    });

    it('Should get HTTP status 200', async () => {
      let res;
      try {
        res = await ezmesure({
          method: 'GET',
          url: '/logs',
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        });
      } catch (err) {
        res = err?.response;
      }

      expect(res).toHaveProperty('status', 200);
    });

    afterAll(async () => {
      await deleteUser('user01');
      await deleteIndex('index-test');
      await deleteRole('role-test');
    });
  });
});

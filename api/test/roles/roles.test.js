const ezmesure = require('../utils/ezmesure');

const login = require('../utils/login');
const { createUser, deleteUser } = require('../utils/users');
const { createRole, deleteRole } = require('../utils/roles');

describe('GET /roles', () => {
  describe('GET /roles - get all roles with ezmesure-admin token', () => {
    let token;
    beforeAll(async () => {
      token = await login('ezmesure-admin', 'changeme');
      await createRole('role-test1', [{ names: ['index-test1'], privileges: ['all'] }]);
      await createRole('role-test2', [{ names: ['index-test1', 'index-test2'], privileges: ['all'] }]);
    });

    it('Should get all roles', async () => {
      let res;
      try {
        res = await ezmesure({
          method: 'GET',
          url: '/roles',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } catch (err) {
        res = err?.response;
      }

      expect(res).toHaveProperty('status', 200);

      const roles = res?.data;
      const role1 = roles[0];

      expect(role1).toHaveProperty('name', 'role-test1');
      expect(role1).toHaveProperty('metadata', {});
      expect(role1).toHaveProperty('transient_metadata', { enabled: true });
      expect(role1).toHaveProperty('kibana', []);
      expect(role1).toHaveProperty('_transform_error', []);
      expect(role1).toHaveProperty('_unrecognized_applications', []);

      const indices1 = role1?.elasticsearch;
      expect(indices1).toHaveProperty('indices', [{ allow_restricted_indices: false, names: ['index-test1'], privileges: ['all'] }]);

      const role2 = roles[1];
      expect(role2).toHaveProperty('name', 'role-test2');
      expect(role2).toHaveProperty('metadata', {});
      expect(role2).toHaveProperty('transient_metadata', { enabled: true });
      expect(role2).toHaveProperty('kibana', []);
      expect(role2).toHaveProperty('_transform_error', []);
      expect(role2).toHaveProperty('_unrecognized_applications', []);

      const indices2 = role2?.elasticsearch;
      expect(indices2).toHaveProperty('indices', [{ allow_restricted_indices: false, names: ['index-test1', 'index-test2'], privileges: ['all'] }]);
    });

    afterAll(async () => {
      await deleteRole('role-test1');
      await deleteRole('role-test2');
    });
  });

  describe('GET /roles - get all roles with user01 token', () => {
    let token;
    beforeAll(async () => {
      await createUser('user01', 'password', []);
      token = await login('user01', 'password');
      await createRole('role-test1', [{ names: ['index-test1'], privileges: ['all'] }]);
      await createRole('role-test2', [{ names: ['index-test1', 'index-test2'], privileges: ['all'] }]);
    });

    it('Should get http status 403', async () => {
      let res;
      try {
        res = await ezmesure({
          method: 'GET',
          url: '/roles',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } catch (err) {
        res = err?.response;
      }
      expect(res).toHaveProperty('status', 403);
    });

    afterAll(async () => {
      await deleteRole('role-test1');
      await deleteRole('role-test2');
      await deleteUser('user01');
    });
  });

  describe('GET /roles - get all roles without token', () => {
    beforeAll(async () => {
      await createRole('role-test1', [{ names: ['index-test1'], privileges: ['all'] }]);
      await createRole('role-test2', [{ names: ['index-test1', 'index-test2'], privileges: ['all'] }]);
    });

    it('Should get http status 401', async () => {
      let res;
      try {
        res = await ezmesure({
          method: 'GET',
          url: '/roles',
        });
      } catch (err) {
        res = err?.response;
      }
      expect(res).toHaveProperty('status', 401);
    });

    afterAll(async () => {
      await deleteRole('role-test1');
      await deleteRole('role-test2');
    });
  });

  describe('GET /roles/role-test - get role "role-test" with ezmesure-admin token', () => {
    let token;
    beforeAll(async () => {
      token = await login('ezmesure-admin', 'changeme');
      await createRole('role-test', [{ names: ['index-test'], privileges: ['all'] }]);
    });

    it('Should get role "role-test"', async () => {
      let res;
      try {
        res = await ezmesure({
          method: 'GET',
          url: '/roles/role-test',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } catch (err) {
        res = err?.response;
      }

      expect(res).toHaveProperty('status', 200);

      const role = res?.data;

      expect(role).toHaveProperty('name', 'role-test');
      expect(role).toHaveProperty('metadata', {});
      expect(role).toHaveProperty('transient_metadata', { enabled: true });
      expect(role).toHaveProperty('kibana', []);
      expect(role).toHaveProperty('_transform_error', []);
      expect(role).toHaveProperty('_unrecognized_applications', []);

      const indices1 = role?.elasticsearch;
      expect(indices1).toHaveProperty('indices', [{ allow_restricted_indices: false, names: ['index-test'], privileges: ['all'] }]);
    });

    afterAll(async () => {
      await deleteRole('role-test');
    });
  });

  describe('GET /roles/role - get role "role" with ezmesure-admin token', () => {
    let token;
    beforeAll(async () => {
      token = await login('ezmesure-admin', 'changeme');
    });

    it('Should get http status 404', async () => {
      let res;
      try {
        res = await ezmesure({
          method: 'GET',
          url: '/roles/role',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } catch (err) {
        res = err?.response;
      }

      expect(res).toHaveProperty('status', 404);
    });
  });

  describe('GET /roles/role-test - get role "role-test" with user01 token', () => {
    let token;
    beforeAll(async () => {
      await createUser('user01', 'password', []);
      token = await login('user01', 'password');
    });

    it('Should get http status 403', async () => {
      let res;
      try {
        res = await ezmesure({
          method: 'GET',
          url: '/roles/role-test',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } catch (err) {
        res = err?.response;
      }

      expect(res).toHaveProperty('status', 403);
    });

    afterAll(async () => {
      await deleteUser('user01');
    });
  });

  describe('GET /roles/role-test - get role "role-test" without token', () => {
    it('Should get http status 404', async () => {
      let res;
      try {
        res = await ezmesure({
          method: 'GET',
          url: '/roles/role-test',
        });
      } catch (err) {
        res = err?.response;
      }

      expect(res).toHaveProperty('status', 401);
    });
  });
});

describe('PUT /roles', () => {
  describe('PUT /roles/role-test - add role "role-test"', () => {
    let token;
    beforeAll(async () => {
      token = await login('ezmesure-admin', 'changeme');
    });

    it('Should create role "role-test"', async () => {
      let res;
      try {
        res = await ezmesure({
          method: 'PUT',
          url: '/roles/role-test',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          data: {
            name: 'role-test',
            elasticsearch: {
              indices: [
                {
                  names: ['index-test'],
                  privileges: ['all'],
                },
              ],
            },
          },
        });
      } catch (err) {
        res = err?.response;
      }

      expect(res).toHaveProperty('status', 204);
    });

    it('Should get role "role-test"', async () => {
      let res;
      try {
        res = await ezmesure({
          method: 'GET',
          url: '/roles/role-test',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } catch (err) {
        res = err?.response;
      }

      expect(res).toHaveProperty('status', 200);
    });

    afterAll(async () => {
      await deleteRole('role-test');
    });
  });

  describe('PUT /roles/role-test - update role "role-test" with ezmesure-admin token', () => {
    let token;
    beforeAll(async () => {
      token = await login('ezmesure-admin', 'changeme');
      await createRole('role-test', [{ names: ['index-test'], privileges: ['all'] }]);
    });

    it('Should update role "role-test"', async () => {
      let res;
      try {
        res = await ezmesure({
          method: 'PUT',
          url: '/roles/role-test',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          data: {
            name: 'role-test',
            elasticsearch: {
              indices: [
                {
                  names: ['index-test'],
                  privileges: ['all'],
                },
              ],
            },
          },
        });
      } catch (err) {
        res = err?.response;
      }

      expect(res).toHaveProperty('status', 204);
    });

    afterAll(async () => {
      await deleteRole('role-test');
    });
  });

  describe('PUT /roles/role-test - update role "role-test" with user01 token', () => {
    let token;
    beforeAll(async () => {
      await createUser('user01', 'password', []);
      token = await login('user01', 'password');
    });

    it('Should get http status 403', async () => {
      let res;
      try {
        res = await ezmesure({
          method: 'PUT',
          url: '/roles/role-test',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          data: {
            name: 'role-test',
            elasticsearch: {
              indices: [
                {
                  names: ['index-test'],
                  privileges: ['all'],
                },
              ],
            },
          },
        });
      } catch (err) {
        res = err?.response;
      }

      expect(res).toHaveProperty('status', 403);
    });

    afterAll(async () => {
      await deleteUser('user01');
    });
  });

  describe('PUT /roles/role-test - update role "role-test" without token', () => {
    it('Should get http status 401', async () => {
      let res;
      try {
        res = await ezmesure({
          method: 'PUT',
          url: '/roles/role-test',
          data: {
            name: 'role-test',
            elasticsearch: {
              indices: [
                {
                  names: ['index-test'],
                  privileges: ['all'],
                },
              ],
            },
          },
        });
      } catch (err) {
        res = err?.response;
      }

      expect(res).toHaveProperty('status', 401);
    });
  });
});

describe('DELETE /roles', () => {
  describe('DELETE /roles/role-test - delete role "role-test" with ezmesure-admin token', () => {
    let token;

    beforeAll(async () => {
      token = await login('ezmesure-admin', 'changeme');
      await createRole('role-test', [{ names: ['index-test1'], privileges: ['all'] }]);
    });

    it('Should delete role "role-test"', async () => {
      let res;
      try {
        res = await ezmesure({
          method: 'DELETE',
          url: '/roles/role-test',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } catch (err) {
        res = err?.response;
      }

      expect(res).toHaveProperty('status', 204);
    });
  });

  describe('DELETE /roles/role-test - delete role "role-test" with ezmesure-admin token', () => {
    let token;
    beforeAll(async () => {
      token = await login('ezmesure-admin', 'changeme');
    });

    it('Should get http status 404', async () => {
      let res;
      try {
        res = await ezmesure({
          method: 'DELETE',
          url: '/roles/role-test',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } catch (err) {
        res = err?.response;
      }

      expect(res).toHaveProperty('status', 404);
    });
  });

  describe('DELETE /roles/role-test - delete role "role-test" with user01 token', () => {
    let token;
    beforeAll(async () => {
      await createUser('user01', 'password', []);
      token = await login('user01', 'password');
    });

    it('Should get http status 403', async () => {
      let res;
      try {
        res = await ezmesure({
          method: 'DELETE',
          url: '/roles/role-test',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } catch (err) {
        res = err?.response;
      }

      expect(res).toHaveProperty('status', 403);
    });

    afterAll(async () => {
      await deleteUser('user01');
    });
  });

  describe('DELETE /roles/role-test - delete role "role-test" without token', () => {
    it('Should get http status 401', async () => {
      let res;
      try {
        res = await ezmesure({
          method: 'DELETE',
          url: '/roles/role-test',
        });
      } catch (err) {
        res = err?.response;
      }

      expect(res).toHaveProperty('status', 401);
    });
  });
});

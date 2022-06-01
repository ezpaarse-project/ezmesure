const ezmesure = require('../setup/ezmesure');

const { createUser, deleteUser } = require('../setup/users');
const login = require('../setup/login');

describe('GET /users', () => {
  describe('GET /users - get all users with ezmesure-admin token', () => {
    let token;
    beforeAll(async () => {
      token = await login('ezmesure-admin', 'changeme');
    });

    it('Should get all users', async () => {
      let res;
      try {
        res = await ezmesure({
          method: 'GET',
          url: '/users',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } catch (err) {
        res = err?.response;
      }
      expect(res?.data).toEqual([{ full_name: 'ezMESURE Administrator', username: 'ezmesure-admin' }]);
    });
  });

  describe('GET /users/ezmesure-admin - get user "elastic" with ezmesure-admin token', () => {
    let token;
    beforeAll(async () => {
      token = await login('ezmesure-admin', 'changeme');
    });

    it('Should get user "ezmesure-admin"', async () => {
      let res;
      try {
        res = await ezmesure({
          method: 'GET',
          url: '/users/ezmesure-admin',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } catch (err) {
        res = err?.response;
      }

      const user = res?.data['ezmesure-admin'];

      expect(user).toHaveProperty('username', 'ezmesure-admin');
      expect(user).toHaveProperty('roles', ['superuser']);
      expect(user).toHaveProperty('full_name', 'ezMESURE Administrator');
      expect(user).toHaveProperty('email', 'admin@admin.com');
      expect(user).toHaveProperty('metadata', { acceptedTerms: true });
      expect(user).toHaveProperty('enabled', true);
    });
  });

  describe('GET /users/elastic - get user "elastic" with ezmesure-admin token', () => {
    let token;
    beforeAll(async () => {
      token = await login('ezmesure-admin', 'changeme');
    });

    it('Should get user "elastic"', async () => {
      let res;
      try {
        res = await ezmesure({
          method: 'GET',
          url: '/users/elastic',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } catch (err) {
        res = err?.response;
      }

      const user = res?.data?.elastic;

      expect(user).toHaveProperty('username', 'elastic');
      expect(user).toHaveProperty('roles', ['superuser']);
      expect(user).toHaveProperty('full_name', null);
      expect(user).toHaveProperty('email', null);
      expect(user).toHaveProperty('metadata', { _reserved: true });
      expect(user).toHaveProperty('enabled', true);
    });
  });

  describe('GET /users/user01 - get user "user01" with ezmesure-admin token', () => {
    let token;
    beforeAll(async () => {
      token = await login('ezmesure-admin', 'changeme');
    });

    it('Should get HTTP status 404', async () => {
      let res;
      try {
        await ezmesure({
          method: 'GET',
          url: '/users/user01',
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
});

describe('PUT /users/:username', () => {
  describe('PUT /users/user01 - create new user with ezmesure-admin token', () => {
    let token;
    beforeAll(async () => {
      token = await login('ezmesure-admin', 'changeme');
    });

    it('Should create new user "user01"', async () => {
      let res;
      try {
        res = await ezmesure({
          method: 'PUT',
          url: '/users/user01',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          data: {
            username: 'user01',
            enabled: true,
            email: 'user@test.fr',
            full_name: 'User test',
            metadata: {},
            password: 'password',
            roles: [],
          },
        });
      } catch (err) {
        res = err?.response;
      }

      expect(res).toHaveProperty('status', 201);
      expect(res?.data).toHaveProperty('created', true);
    });

    it('Should get user "user01"', async () => {
      let res;
      try {
        res = await ezmesure({
          method: 'GET',
          url: '/users/user01',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } catch (err) {
        res = err?.response;
      }

      const user = res?.data?.user01;

      expect(user).toHaveProperty('username', 'user01');
      expect(user).toHaveProperty('roles', []);
      expect(user).toHaveProperty('full_name', 'User test');
      expect(user).toHaveProperty('email', 'user@test.fr');
      expect(user).toHaveProperty('metadata', {});
      expect(user).toHaveProperty('enabled', true);
    });

    afterAll(async () => {
      await deleteUser('user01');
    });
  });

  describe('PUT /users/user01 - update "user01" with ezmesure-admin token', () => {
    let token;
    beforeAll(async () => {
      await createUser('user01', 'password', []);
      token = await login('ezmesure-admin', 'changeme');
    });

    it('Should update new user "user01"', async () => {
      let res;
      try {
        res = await ezmesure({
          method: 'PUT',
          url: '/users/user01',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          data: {
            username: 'user01',
            enabled: true,
            email: 'user@test.fr',
            full_name: '<<UPDATED>> full_name',
            metadata: {},
            password: 'password',
            roles: [],
          },
        });
      } catch (err) {
        res = err?.response;
      }

      expect(res).toHaveProperty('status', 200);
    });

    it('Should get user "user01"', async () => {
      let res;
      try {
        res = await ezmesure({
          method: 'GET',
          url: '/users/user01',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } catch (err) {
        res = err?.response;
      }

      const user = res?.data?.user01;

      expect(user).toHaveProperty('username', 'user01');
      expect(user).toHaveProperty('roles', []);
      expect(user).toHaveProperty('full_name', '<<UPDATED>> full_name');
      expect(user).toHaveProperty('email', 'user@test.fr');
      expect(user).toHaveProperty('metadata', {});
      expect(user).toHaveProperty('enabled', true);
    });

    afterAll(async () => {
      await deleteUser('user01');
    });
  });

  describe('PUT /users/user01 - update "user01" with user01 token', () => {
    let token;
    beforeAll(async () => {
      await createUser('user01', 'password', []);
      token = await login('user01', 'password');
    });

    it('Should get HTTP status 403', async () => {
      let res;
      try {
        res = await ezmesure({
          method: 'PUT',
          url: '/users/user01',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          data: {
            username: 'user01',
            enabled: true,
            email: 'user@test.fr',
            full_name: '<<UPDATED>> full_name',
            metadata: {},
            password: 'password',
            roles: [],
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

  describe('PUT /users/user01 - create new user without token', () => {
    it('Should get HTTP status 401', async () => {
      let res;
      try {
        res = await ezmesure({
          method: 'PUT',
          url: '/users/user01',
          data: {
            username: 'user01',
            enabled: true,
            email: 'user@test.fr',
            full_name: 'User test',
            metadata: {},
            password: 'password',
            roles: [],
          },
        });
      } catch (err) {
        res = err?.response;
      }

      expect(res).toHaveProperty('status', 401);
    });

    afterAll(async () => {
      await deleteUser('user01');
    });
  });
});

describe('DELETE /users/:username', () => {
  describe('DELETE /users - delete "user01" with ezmesure-admin token', () => {
    let token;
    beforeAll(async () => {
      await createUser('user01', 'password', []);
      token = await login('ezmesure-admin', 'changeme');
    });

    it('Should delete "user01"', async () => {
      let res;
      try {
        res = await ezmesure({
          method: 'DELETE',
          url: '/users/user01',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } catch (err) {
        res = err?.response;
      }

      expect(res).toHaveProperty('status', 200);
    });

    it('Should get HTTP status 404', async () => {
      let res;
      try {
        await ezmesure({
          method: 'GET',
          url: '/users/user01',
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

  describe('DELETE /users - delete "user01" without token', () => {
    beforeAll(async () => {
      await createUser('user01', 'password', []);
    });

    it('Should get HTTP status 401', async () => {
      let res;
      try {
        res = await ezmesure({
          method: 'DELETE',
          url: '/users/user01',
        });
      } catch (err) {
        res = err?.response;
      }

      expect(res).toHaveProperty('status', 401);
    });

    afterAll(async () => {
      await deleteUser('user01');
    });
  });

  describe('DELETE /users - delete "user01" without user01 token', () => {
    let token;
    beforeAll(async () => {
      await createUser('user01', 'password', []);
      token = await login('user01', 'password');
    });

    it('Should get HTTP status 403', async () => {
      let res;
      try {
        res = await ezmesure({
          method: 'DELETE',
          url: '/users/user01',
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
});

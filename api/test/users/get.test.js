const ezmesure = require('../utils/ezmesure');

const login = require('../utils/login');

describe('GET /users', () => {
  let token;
  beforeAll(async () => {
    token = await login('ezmesure-admin', 'changeme');
  });

  describe('GET /users - get all users', () => {
    test('Should request ezmesure API to get all users', async () => {
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
        console.error(err?.response?.data);
        return;
      }
      expect(res?.data).toEqual([{ full_name: 'ezMESURE Administrator', username: 'ezmesure-admin' }]);
    });
  });

  describe('GET /users/elastic - get user "elastic"', () => {
    test('Should get user "elastic"', async () => {
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
        console.error(err?.response?.data);
        return;
      }

      const user = res?.data['ezmesure-admin'];

      expect(user).toHaveProperty('username', 'ezmesure-admin');
      expect(user).toHaveProperty('roles', ['superuser']);
      expect(user).toHaveProperty('full_name', 'ezMESURE Administrator');
      expect(user).toHaveProperty('email', null);
      expect(user).toHaveProperty('metadata', { acceptedTerms: true });
      expect(user).toHaveProperty('enabled', true);
    });
  });

  describe('GET /users/elastic - get user "elastic"', () => {
    test('Should get user "elastic"', async () => {
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
        console.error(err?.response?.data);
        return;
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

  describe('GET /users/user01 - get user "user01"', () => {
    test('Should get error 404', async () => {
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
        res = err?.response?.data;
        return;
      }

      expect(res).toHaveProperty('status', 404);
      expect(res).toHaveProperty('error', 'User not found');
    });
  });

  describe('GET /users/ - don\'t get user', () => {
    test('Should get error 401', async () => {
      let res;
      try {
        await ezmesure({
          method: 'GET',
          url: '/users',
        });
      } catch (err) {
        res = err?.response?.data;
        return;
      }

      expect(res).toHaveProperty('status', 404);
      expect(res).toHaveProperty('error', 'User not found');
    });
  });
});

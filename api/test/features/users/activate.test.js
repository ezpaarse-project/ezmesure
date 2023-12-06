const ezmesure = require('../../setup/ezmesure');

const { resetDatabase } = require('../../../lib/services/prisma/utils');

const usersPrisma = require('../../../lib/services/prisma/users');
const usersElastic = require('../../../lib/services/elastic/users');
const usersService = require('../../../lib/entities/users.service');

describe('[users]: Test activate users features', () => {
  const userTest = {
    username: 'user.test',
    email: 'user.test@test.fr',
    fullName: 'User test',
    isAdmin: false,
  };

  const data = {
    password: 'changeme',
    acceptTerms: true,
  };

  beforeAll(async () => {
    await resetDatabase();
  });
  describe('As user', () => {
    describe(`activate new user [${userTest.username}] with user-test token`, () => {
      let userToken;

      beforeAll(async () => {
        await usersPrisma.create({ data: userTest });
        await usersElastic.createUser(userTest);
        userToken = await usersService.generateTokenForActivate(userTest.username);
      });

      it(`#01 Should activate user [${userTest.username}]`, async () => {
        const httpAppResponse = await ezmesure({
          method: 'POST',
          url: '/profile/_activate',
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
          data,
        });

        // Test API
        expect(httpAppResponse).toHaveProperty('status', 200);

        // Test user service
        const userFromService = await usersPrisma.findByUsername('user.test');

        expect(userFromService).toHaveProperty('username', userTest.username);
        expect(userFromService).toHaveProperty('fullName', userTest.fullName);
        expect(userFromService).toHaveProperty('email', userTest.email);
        expect(userFromService).toHaveProperty('isAdmin', false);
        expect(userFromService?.createdAt).not.toBeNull();
        expect(userFromService?.updatedAt).not.toBeNull();
        expect(userFromService?.metadata).toHaveProperty('acceptedTerms', true);
      });

      afterAll(async () => {
        await usersPrisma.removeAll();
      });
    });
  });
  afterAll(async () => {
    await resetDatabase();
  });
});

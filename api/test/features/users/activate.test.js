const ezmesure = require('../../setup/ezmesure');

const usersService = require('../../../lib/entities/users.service');

const { createUserAsAdmin } = require('../../setup/users');
const { getUserTokenForActivate } = require('../../setup/login');

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
  describe('As user', () => {
    describe(`activate new user [${userTest.username}] with user-test token`, () => {
      let userToken;

      beforeAll(async () => {
        await createUserAsAdmin(
          userTest.username,
          userTest.email,
          userTest.fullName,
          userTest.isAdmin,
        );
        userToken = await getUserTokenForActivate(userTest.username);
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
        const userFromService = await usersService.findByUsername('user.test');

        expect(userFromService).toHaveProperty('username', userTest.username);
        expect(userFromService).toHaveProperty('fullName', userTest.fullName);
        expect(userFromService).toHaveProperty('email', userTest.email);
        expect(userFromService).toHaveProperty('isAdmin', false);
        expect(userFromService?.createdAt).not.toBeNull();
        expect(userFromService?.updatedAt).not.toBeNull();
        expect(userFromService?.metadata).toHaveProperty('acceptedTerms', true);
      });

      afterAll(async () => {
        await usersService.deleteAll();
      });
    });
  });
});

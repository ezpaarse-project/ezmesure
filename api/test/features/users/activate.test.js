const ezmesure = require('../../setup/ezmesure');

const { createUserAsAdmin, deleteUserAsAdmin } = require('../../setup/users');
const { getAdminToken, getUserTokenForActivate } = require('../../setup/login');

describe('[users]: Test activate users features', () => {
  describe('As user', () => {
    describe('POST /profile/_activate - activate new user [user.test] with user-test token', () => {
      let userToken;
      let adminToken;
      let userTest;

      beforeAll(async () => {
        userTest = await createUserAsAdmin('user.test', 'user.test@test.fr', 'User test', false);
        userToken = await getUserTokenForActivate('user.test');
        adminToken = await getAdminToken();
      });

      it('Should activate user [user.test]', async () => {
        const res = await ezmesure({
          method: 'POST',
          url: '/profile/_activate',
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
          data: {
            password: 'changeme',
            acceptTerms: true,
          },
        });

        expect(res).toHaveProperty('status', 200);
      });

      it('Should get user [user.test]', async () => {
        const res = await ezmesure({
          method: 'GET',
          url: '/users/user.test',
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        });

        expect(res).toHaveProperty('status', 200);

        const user = res?.data;
        expect(user).toHaveProperty('username', 'user.test');
        expect(user).toHaveProperty('fullName', 'User test');
        expect(user).toHaveProperty('email', 'user.test@test.fr');
        expect(user).toHaveProperty('isAdmin', false);
        expect(user?.createdAt).not.toBeNull();
        expect(user?.updatedAt).not.toBeNull();
        expect(user?.metadata).toHaveProperty('acceptedTerms', true);
      });

      afterAll(async () => {
        await deleteUserAsAdmin(userTest.username);
      });
    });
  });
});

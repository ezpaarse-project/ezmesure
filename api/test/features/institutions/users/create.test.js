const ezmesure = require('../../../setup/ezmesure');

const { createInstitutionAsAdmin, deleteInstitutionAsAdmin, addPermissionsToUserAsAdmin } = require('../../../setup/institutions');
const { deleteUserAsAdmin, createUserAsAdmin, activateUser } = require('../../../setup/users');
const { getToken, getAdminToken } = require('../../../setup/login');

describe('[institutions]: Test users in institutions features', () => {
  describe('Create', () => {
    const institutionTest = {
      name: 'Test',
      namespace: 'test',
    };

    describe('As admin', () => {
      describe('PUT /institutions/<id>/memberships/<username> - Add membership with roles [guest] of user [user.test] for institution [Test]', () => {
        let adminToken;
        let institutionId;
        let userTest;

        beforeAll(async () => {
          adminToken = await getAdminToken();
          institutionId = await createInstitutionAsAdmin(institutionTest);
          userTest = await createUserAsAdmin('user.test', 'user.test@test.fr', 'User test', false);
          await activateUser('user.test', 'changeme');
        });

        it('Should attach user [user.test] in institution [Test] with role [guest]', async () => {
          const res = await ezmesure({
            method: 'PUT',
            url: `/institutions/${institutionId}/memberships/${userTest.username}`,
            data: {
              roles: ['guest'],
            },
            headers: {
              Authorization: `Bearer ${adminToken}`,
            },
          });
          expect(res).toHaveProperty('status', 200);
        });

        it('Should get institution [Test] with its members', async () => {
          // TODO
        });

        it('Should get user [user.test] with its institutions', async () => {
          // TODO
        });

        afterAll(async () => {
          await deleteInstitutionAsAdmin(institutionId);
          await deleteUserAsAdmin(userTest.username);
        });
      });

      describe('PUT /institutions/<id>/memberships/<username> - Add membership with roles [doc_contact, tech_contact] of user [user.test] for institution [Test]', () => {
        let adminToken;
        let institutionId;
        let userTest;

        beforeAll(async () => {
          adminToken = await getAdminToken();
          institutionId = await createInstitutionAsAdmin(institutionTest);
          userTest = await createUserAsAdmin('user.test', 'user.test@test.fr', 'User test', false);
          await activateUser('user.test', 'changeme');
        });

        it('Should attach user [user.test] in institution [Test] with roles [doc_contact, tech_contact]', async () => {
          const res = await ezmesure({
            method: 'PUT',
            url: `/institutions/${institutionId}/memberships/${userTest.username}`,
            data: {
              roles: ['doc_contact', 'tech_contact'],
            },
            headers: {
              Authorization: `Bearer ${adminToken}`,
            },
          });
          expect(res).toHaveProperty('status', 200);
        });

        it('Should get institution [Test] with its members', async () => {
          // TODO
        });

        it('Should get user [user.test] with its institutions', async () => {
          // TODO
        });

        afterAll(async () => {
          await deleteInstitutionAsAdmin(institutionId);
          await deleteUserAsAdmin(userTest.username);
        });
      });
    });

    describe('As user', () => {
      describe('PUT /institutions/<id>/memberships/<username> - Add membership with roles [guest] of user [user.test] for institution [Test]', () => {
        let userContactToken;
        let institutionId;
        let userTestContact;
        let userTest;

        beforeAll(async () => {
          institutionId = await createInstitutionAsAdmin(institutionTest);
          userTestContact = await createUserAsAdmin('user.test', 'user.test@test.fr', 'User test', false);
          await activateUser('user.test', 'changeme');
          await addPermissionsToUserAsAdmin(institutionId, userTestContact.username, ['memberships:read', 'memberships:write']);
          userContactToken = await getToken('user.test', 'changeme');
          userTest = await createUserAsAdmin('user.test', 'user.test@test.fr', 'User test', false);
          await activateUser('user.test', 'changeme');
        });

        it('Should attach user [user.test] in institution [Test] with permissions [memberships:read]', async () => {
          const res = await ezmesure({
            method: 'PUT',
            url: `/institutions/${institutionId}/memberships/${userTest.username}`,
            data: {
              permissions: ['memberships:read'],
            },
            headers: {
              Authorization: `Bearer ${userContactToken}`,
            },
          });

          expect(res).toHaveProperty('status', 200);
        });

        it('Should get institution [Test] with its members', async () => {
          // TODO
        });

        it('Should get user [user.test] with its institutions', async () => {
          // TODO
        });

        afterAll(async () => {
          await deleteInstitutionAsAdmin(institutionId);
          await deleteUserAsAdmin(userTestContact.username);
        });
      });

      describe('PUT /institutions/<id>/memberships/<username> - Add membership with roles [doc_contact, tech_contact] of user [user.test] for institution [Test]', () => {
        let userContactToken;
        let institutionId;
        let userTestContact;
        let userTest;

        beforeAll(async () => {
          institutionId = await createInstitutionAsAdmin(institutionTest);

          userTestContact = await createUserAsAdmin('user.test', 'user.test@test.fr', 'User test', false);
          await activateUser('user.test', 'changeme');
          await addPermissionsToUserAsAdmin(institutionId, userTestContact.username, ['memberships:read', 'memberships:write']);
          userContactToken = await getToken('user.test', 'changeme');

          userTest = await createUserAsAdmin('user.test', 'user.test@test.fr', 'User test', false);
          await activateUser('user.test', 'changeme');
        });

        it('Should attach user [user.test] in institution [Test] with roles [memberships:read, memberships:write]', async () => {
          const res = await ezmesure({
            method: 'PUT',
            url: `/institutions/${institutionId}/memberships/${userTest.username}`,
            data: {
              permissions: ['memberships:read', 'memberships:write'],
            },
            headers: {
              Authorization: `Bearer ${userContactToken}`,
            },
          });
          expect(res).toHaveProperty('status', 200);
        });

        it('Should get institution [Test] with its members', async () => {
          // TODO
        });

        it('Should get user [user.test] with its institutions', async () => {
          // TODO
        });

        afterAll(async () => {
          await deleteInstitutionAsAdmin(institutionId);
          await deleteUserAsAdmin(userTestContact.username);
        });
      });
    });
  });
});

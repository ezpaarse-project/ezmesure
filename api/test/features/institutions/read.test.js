const ezmesure = require('../../setup/ezmesure');

const {
  createInstitutionAsAdmin,
  createInstitution,
  deleteInstitutionAsAdmin,
} = require('../../setup/institutions');

const {
  createDefaultActivatedUserAsAdmin,
  deleteUserAsAdmin,
} = require('../../setup/users');

const { getToken, getAdminToken } = require('../../setup/login');

describe('[institutions]: Test read features', () => {
  const institutionTest = {
    name: 'Test',
    namespace: 'test',
  };

  let adminToken;

  beforeAll(async () => {
    adminToken = await getAdminToken();
  });

  describe('As admin', () => {
    describe('GET /institutions - Get institutions', () => {
      let institutionId;

      beforeAll(async () => {
        institutionId = await createInstitutionAsAdmin(institutionTest);
      });

      it('Should get all institutions', async () => {
        const res = await ezmesure({
          method: 'GET',
          url: '/institutions',
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        });

        expect(res).toHaveProperty('status', 200);

        const institutions = res?.data[0];
        expect(institutions?.id).not.toBeNull();
        expect(institutions).toHaveProperty('parentInstitutionId', null);
        expect(institutions?.createdAt).not.toBeNull();
        expect(institutions?.updatedAt).not.toBeNull();
        expect(institutions).toHaveProperty('name', 'Test');
        expect(institutions).toHaveProperty('namespace', 'test');
        expect(institutions).toHaveProperty('validated', false);
        expect(institutions).toHaveProperty('hidePartner', false);
        expect(institutions).toHaveProperty('tags', []);
        expect(institutions).toHaveProperty('logoId', null);
        expect(institutions).toHaveProperty('type', null);
        expect(institutions).toHaveProperty('acronym', null);
        expect(institutions).toHaveProperty('websiteUrl', null);
        expect(institutions).toHaveProperty('city', null);
        expect(institutions).toHaveProperty('uai', null);
        expect(institutions).toHaveProperty('social', null);
        expect(institutions).toHaveProperty('sushiReadySince', null);
      });

      afterAll(async () => {
        await deleteInstitutionAsAdmin(institutionId);
      });
    });

    describe('GET /institutions/<id> - Get institution [Test]', () => {
      let institutionId;

      beforeAll(async () => {
        institutionId = await createInstitutionAsAdmin(institutionTest);
      });

      it('Should get institution [Test]', async () => {
        const res = await ezmesure({
          method: 'GET',
          url: `/institutions/${institutionId}`,
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        });

        expect(res).toHaveProperty('status', 200);

        const institution = res?.data;
        expect(institution?.id).not.toBeNull();
        expect(institution).toHaveProperty('parentInstitutionId', null);
        expect(institution?.createdAt).not.toBeNull();
        expect(institution?.updatedAt).not.toBeNull();
        expect(institution).toHaveProperty('name', 'Test');
        expect(institution).toHaveProperty('namespace', 'test');
        expect(institution).toHaveProperty('validated', false);
        expect(institution).toHaveProperty('hidePartner', false);
        expect(institution).toHaveProperty('tags', []);
        expect(institution).toHaveProperty('logoId', null);
        expect(institution).toHaveProperty('type', null);
        expect(institution).toHaveProperty('acronym', null);
        expect(institution).toHaveProperty('websiteUrl', null);
        expect(institution).toHaveProperty('city', null);
        expect(institution).toHaveProperty('uai', null);
        expect(institution).toHaveProperty('social', null);
        expect(institution).toHaveProperty('sushiReadySince', null);
      });

      afterAll(async () => {
        await deleteInstitutionAsAdmin(institutionId);
      });
    });
  });

  describe('As user', () => {
    let userToken;
    let userTest;

    beforeAll(async () => {
      userTest = await createDefaultActivatedUserAsAdmin();
      userToken = await getToken(userTest.username, userTest.password);
    });
    describe('GET /institutions - Get institution with user-test token', () => {
      let institutionId;

      beforeAll(async () => {
        userTest = await createDefaultActivatedUserAsAdmin();
        userToken = await getToken(userTest.username, userTest.password);

        institutionId = await createInstitutionAsAdmin(institutionTest);
      });

      it('Should get all institutions', async () => {
        const res = await ezmesure({
          method: 'GET',
          url: '/institutions',
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        });

        const institutions = res?.data[0];

        expect(institutions?.id).not.toBeNull();
        expect(institutions).toHaveProperty('parentInstitutionId', null);
        expect(institutions?.createdAt).not.toBeNull();
        expect(institutions?.updatedAt).not.toBeNull();
        expect(institutions).toHaveProperty('name', 'Test');
        expect(institutions).toHaveProperty('namespace', 'test');
        expect(institutions).toHaveProperty('validated', false);
        expect(institutions).toHaveProperty('hidePartner', false);
        expect(institutions).toHaveProperty('tags', []);
        expect(institutions).toHaveProperty('logoId', null);
        expect(institutions).toHaveProperty('type', null);
        expect(institutions).toHaveProperty('acronym', null);
        expect(institutions).toHaveProperty('websiteUrl', null);
        expect(institutions).toHaveProperty('city', null);
        expect(institutions).toHaveProperty('uai', null);
        expect(institutions).toHaveProperty('social', null);
        expect(institutions).toHaveProperty('sushiReadySince', null);

        expect(res).toHaveProperty('status', 200);
      });

      afterAll(async () => {
        await deleteInstitutionAsAdmin(institutionId);
      });
    });

    describe('GET /institutions/<id> - Get institution [Test] created by user with user-test token', () => {
      let institutionId;

      beforeAll(async () => {
        institutionId = await createInstitution(institutionTest, userTest);
      });

      it('Should get institution [Test]', async () => {
        const res = await ezmesure({
          method: 'GET',
          url: `/institutions/${institutionId}`,
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        });

        const institutions = res?.data;

        expect(institutions?.id).not.toBeNull();
        expect(institutions).toHaveProperty('parentInstitutionId', null);
        expect(institutions?.createdAt).not.toBeNull();
        expect(institutions?.updatedAt).not.toBeNull();
        expect(institutions).toHaveProperty('name', 'Test');
        expect(institutions).toHaveProperty('namespace', null);
        expect(institutions).toHaveProperty('validated', false);
        expect(institutions).toHaveProperty('hidePartner', false);
        expect(institutions).toHaveProperty('tags', []);
        expect(institutions).toHaveProperty('logoId', null);
        expect(institutions).toHaveProperty('type', null);
        expect(institutions).toHaveProperty('acronym', null);
        expect(institutions).toHaveProperty('websiteUrl', null);
        expect(institutions).toHaveProperty('city', null);
        expect(institutions).toHaveProperty('uai', null);
        expect(institutions).toHaveProperty('social', null);
        expect(institutions).toHaveProperty('sushiReadySince', null);

        expect(res).toHaveProperty('status', 200);
      });

      afterAll(async () => {
        await deleteInstitutionAsAdmin(institutionId);
      });
    });

    describe('GET /institutions/<id> - Get institution [Test] created by admin with user-test token', () => {
      let institutionId;

      beforeAll(async () => {
        institutionId = await createInstitutionAsAdmin(institutionTest);
      });

      it('Should get institution [Test]', async () => {
        const res = await ezmesure({
          method: 'GET',
          url: `/institutions/${institutionId}`,
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        });

        expect(res).toHaveProperty('status', 200);

        const institutions = res?.data;
        expect(institutions?.id).not.toBeNull();
        expect(institutions).toHaveProperty('parentInstitutionId', null);
        expect(institutions?.createdAt).not.toBeNull();
        expect(institutions?.updatedAt).not.toBeNull();
        expect(institutions).toHaveProperty('name', 'Test');
        expect(institutions).toHaveProperty('namespace', 'test');
        expect(institutions).toHaveProperty('validated', false);
        expect(institutions).toHaveProperty('hidePartner', false);
        expect(institutions).toHaveProperty('tags', []);
        expect(institutions).toHaveProperty('logoId', null);
        expect(institutions).toHaveProperty('type', null);
        expect(institutions).toHaveProperty('acronym', null);
        expect(institutions).toHaveProperty('websiteUrl', null);
        expect(institutions).toHaveProperty('city', null);
        expect(institutions).toHaveProperty('uai', null);
        expect(institutions).toHaveProperty('social', null);
        expect(institutions).toHaveProperty('sushiReadySince', null);
      });

      afterAll(async () => {
        await deleteInstitutionAsAdmin(institutionId);
      });
    });
    afterAll(async () => {
      await deleteUserAsAdmin(userTest.username);
    });
  });

  describe('Without token', () => {
    describe('GET /institutions - Get institutions', () => {
      let institutionId;
      beforeAll(async () => {
        institutionId = await createInstitutionAsAdmin(institutionTest);
      });

      it('Should get HTTP status 401', async () => {
        const res = await ezmesure({
          method: 'GET',
          url: '/institutions',
        });

        expect(res).toHaveProperty('status', 401);
      });

      afterAll(async () => {
        await deleteInstitutionAsAdmin(institutionId);
      });
    });

    describe('GET /institutions/<id> - Get institution [Test]', () => {
      let institutionId;

      beforeAll(async () => {
        institutionId = await createInstitutionAsAdmin(institutionTest);
      });

      it('Should get HTTP status 401', async () => {
        const res = await ezmesure({
          method: 'GET',
          url: `/institutions/${institutionId}`,
        });

        expect(res).toHaveProperty('status', 401);
      });

      afterAll(async () => {
        await deleteInstitutionAsAdmin(institutionId);
      });
    });
  });
});

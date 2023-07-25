const ezmesure = require('../../setup/ezmesure');

const {
  createInstitution,
  createInstitutionAsAdmin,
  deleteInstitutionAsAdmin,
  addMembershipsToUserAsAdmin,
  deleteMembershipsToUserAsAdmin,
} = require('../../setup/institutions');
const { createDefaultActivatedUserAsAdmin, deleteUserAsAdmin } = require('../../setup/users');
const { getToken, getAdminToken } = require('../../setup/login');
const { createSushiEndpointAsAdmin, deleteSushiEndpointAsAdmin } = require('../../setup/sushi-endpoint');

describe('[sushi]: Test create sushi features', () => {
  const institutionTest = {
    name: 'Test',
    namespace: 'test',
  };

  const sushiEndpointTest = {
    sushiUrl: 'http://localhost',
    vendor: 'test vendor',
    description: 'test description',
    counterVersion: '5.0.0',
    technicalProvider: 'test technicalProvider',
    requireCustomerId: true,
    requireRequestorId: true,
    requireApiKey: true,
    ignoreReportValidation: true,
    defaultCustomerId: 'test defaultCustomerId',
    defaultRequestorId: 'test defaultRequestorId',
    defaultApiKey: 'defaultApiKey',
    paramSeparator: ',',
    tags: [],
  };

  let adminToken;
  beforeAll(async () => {
    adminToken = await getAdminToken();
  });
  describe('As admin', () => {
    describe('Institution created by admin', () => {
      let institutionId;
      beforeAll(async () => {
        institutionId = await createInstitutionAsAdmin(institutionTest);
      });
      describe('POST /sushi - Create sushi', () => {
        let sushiEndpointId;
        let sushiId;
        let sushiTest;
        beforeAll(async () => {
          sushiEndpointId = await createSushiEndpointAsAdmin(sushiEndpointTest);
          sushiTest = {
            endpointId: sushiEndpointId,
            institutionId,
          };
        });

        it('Should create sushi', async () => {
          const res = await ezmesure({
            method: 'POST',
            url: '/sushi',
            headers: {
              Authorization: `Bearer ${adminToken}`,
            },
            data: sushiTest,
          });
          expect(res).toHaveProperty('status', 201);
          sushiId = res?.data?.id;
        });

        it('Should get sushi', async () => {
          const res = await ezmesure({
            method: 'GET',
            url: `/sushi/${sushiId}`,
            headers: {
              Authorization: `Bearer ${adminToken}`,
            },
          });
          expect(res).toHaveProperty('status', 200);
        });

        afterAll(async () => {
          await deleteSushiEndpointAsAdmin(sushiEndpointId);
        });
      });
      afterAll(async () => {
        await deleteInstitutionAsAdmin(institutionId);
      });
    });
    describe('Institution created by user', () => {
      let userTest;
      let institutionId;
      beforeAll(async () => {
        userTest = await createDefaultActivatedUserAsAdmin();
        institutionId = await createInstitution(institutionTest, userTest);
      });
      describe('POST /sushi - Create sushi', () => {
        let sushiEndpointId;
        let sushiId;
        let sushiTest;
        beforeAll(async () => {
          sushiEndpointId = await createSushiEndpointAsAdmin(sushiEndpointTest);
          sushiTest = {
            endpointId: sushiEndpointId,
            institutionId,
          };
        });

        it('Should create sushi', async () => {
          const res = await ezmesure({
            method: 'POST',
            url: '/sushi',
            headers: {
              Authorization: `Bearer ${adminToken}`,
            },
            data: sushiTest,
          });
          expect(res).toHaveProperty('status', 201);
          sushiId = res?.data?.id;
        });

        it('Should get sushi', async () => {
          const res = await ezmesure({
            method: 'GET',
            url: `/sushi/${sushiId}`,
            headers: {
              Authorization: `Bearer ${adminToken}`,
            },
          });
          expect(res).toHaveProperty('status', 200);
        });

        afterAll(async () => {
          await deleteSushiEndpointAsAdmin(sushiEndpointId);
        });
      });
      afterAll(async () => {
        await deleteInstitutionAsAdmin(institutionId);
      });
    });
  });
  describe('As user', () => {
    let userTest;
    let userToken;

    beforeAll(async () => {
      userTest = await createDefaultActivatedUserAsAdmin();
      userToken = await getToken(userTest.username, userTest.password);
    });

    describe('Institution created by admin', () => {
      let institutionId;
      beforeAll(async () => {
        institutionId = await createInstitutionAsAdmin(institutionTest);
      });
      describe('POST /sushi - Create sushi', () => {
        let sushiEndpointId;
        let sushiTest;
        beforeAll(async () => {
          sushiEndpointId = await createSushiEndpointAsAdmin(sushiEndpointTest);
          sushiTest = {
            endpointId: sushiEndpointId,
            institutionId,
          };
        });

        it('Should HTTP status 403', async () => {
          const res = await ezmesure({
            method: 'POST',
            url: '/sushi',
            headers: {
              Authorization: `Bearer ${userToken}`,
            },
            data: sushiTest,
          });
          expect(res).toHaveProperty('status', 403);
        });

        afterAll(async () => {
          await deleteSushiEndpointAsAdmin(sushiEndpointId);
        });
      });
      afterAll(async () => {
        await deleteInstitutionAsAdmin(institutionId);
      });
    });
    describe('Institution created by user', () => {
      let institutionId;
      beforeAll(async () => {
        institutionId = await createInstitution(institutionTest, userTest);
      });
      describe('User with memberships [sushi:write, sushi:read]', () => {
        beforeAll(async () => {
          try {
            const res = await addMembershipsToUserAsAdmin(institutionId, userTest.username, ['sushi:write', 'sushi:read']);
            console.log(res?.data);
          } catch (err) {
            console.log(err);
          }
        });
        describe('POST /sushi - Create new sushi', () => {
          let sushiEndpointId;
          let sushiId;
          let sushiTest;
          beforeAll(async () => {
            sushiEndpointId = await createSushiEndpointAsAdmin(sushiEndpointTest);
            sushiTest = {
              endpointId: sushiEndpointId,
              institutionId,
            };
          });

          it('Should create sushi', async () => {
            const res = await ezmesure({
              method: 'POST',
              url: '/sushi',
              headers: {
                Authorization: `Bearer ${userToken}`,
              },
              data: sushiTest,
            });
            expect(res).toHaveProperty('status', 201);
            sushiId = res?.data?.id;
          });

          it('Should get sushi', async () => {
            const res = await ezmesure({
              method: 'GET',
              url: `/sushi/${sushiId}`,
              headers: {
                Authorization: `Bearer ${userToken}`,
              },
            });
            expect(res).toHaveProperty('status', 200);
          });

          afterAll(async () => {
            await deleteSushiEndpointAsAdmin(sushiEndpointId);
          });
        });
        beforeAll(async () => {
          await deleteMembershipsToUserAsAdmin(institutionId, userTest.username);
        });
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
    describe('POST /sushi - Create sushi', () => {
      let sushiEndpointId;
      beforeAll(async () => {
        sushiEndpointId = await createSushiEndpointAsAdmin(sushiEndpointTest);
      });
      it('Should get HTTP status 401', async () => {
        const res = await ezmesure({
          method: 'POST',
          url: `/sushi/${sushiEndpointId}`,
        });

        expect(res).toHaveProperty('status', 401);
      });

      it('Should get sushi with no change', async () => {
        const res = await ezmesure({
          method: 'GET',
          url: `/sushi/${sushiEndpointId}`,
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        });
        expect(res).toHaveProperty('status', 200);
        const sushiEndpoint = res?.data;

        expect(sushiEndpoint?.id).not.toBeNull();
        expect(sushiEndpoint?.createdAt).not.toBeNull();
        expect(sushiEndpoint?.updatedAt).not.toBeNull();
        expect(sushiEndpoint).toHaveProperty('sushiUrl', sushiEndpointTest.sushiUrl);
        expect(sushiEndpoint).toHaveProperty('vendor', sushiEndpointTest.vendor);
        expect(sushiEndpoint).toHaveProperty('description', sushiEndpointTest.description);
        expect(sushiEndpoint).toHaveProperty('counterVersion', sushiEndpointTest.counterVersion);
        expect(sushiEndpoint).toHaveProperty('technicalProvider', sushiEndpointTest.technicalProvider);
        expect(sushiEndpoint).toHaveProperty('requireCustomerId', sushiEndpointTest.requireCustomerId);
        expect(sushiEndpoint).toHaveProperty('requireRequestorId', sushiEndpointTest.requireRequestorId);
        expect(sushiEndpoint).toHaveProperty('requireApiKey', sushiEndpointTest.requireApiKey);
        expect(sushiEndpoint).toHaveProperty('ignoreReportValidation', sushiEndpointTest.ignoreReportValidation);
        expect(sushiEndpoint).toHaveProperty('defaultCustomerId', sushiEndpointTest.defaultCustomerId);
        expect(sushiEndpoint).toHaveProperty('defaultRequestorId', sushiEndpointTest.defaultRequestorId);
        expect(sushiEndpoint).toHaveProperty('defaultApiKey', sushiEndpointTest.defaultApiKey);
        expect(sushiEndpoint).toHaveProperty('paramSeparator', sushiEndpointTest.paramSeparator);
      });

      afterAll(async () => {
        await deleteSushiEndpointAsAdmin(sushiEndpointId);
      });
    });
  });
});

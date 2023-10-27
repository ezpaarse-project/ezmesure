const ezmesure = require('../../setup/ezmesure');

const {
  createInstitution,
  createInstitutionAsAdmin,
  deleteInstitutionAsAdmin,
  addMembershipsToUserAsAdmin,
  deleteMembershipsToUserAsAdmin,
  validateInstitutionAsAdmin,
} = require('../../setup/institutions');
const {
  createDefaultActivatedUserAsAdmin,
  createUserAsAdmin,
  deleteUserAsAdmin,
  activateUser,
} = require('../../setup/users');
const { getToken, getAdminToken } = require('../../setup/login');
const { createSushiEndpointAsAdmin, deleteSushiEndpointAsAdmin } = require('../../setup/sushi-endpoint');
const { deleteSushiAsAdmin } = require('../../setup/sushi');

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

  const sushiTest = {
    endpointId: '',
    institutionId: '',
    customerId: 'customerId test',
    requestorId: 'requestorId test',
    apiKey: 'apikey test',
    comment: 'comment test',
    tags: [],
    params: [],
  };

  let adminToken;
  let endpointId;

  beforeAll(async () => {
    adminToken = await getAdminToken();
    endpointId = await createSushiEndpointAsAdmin(sushiEndpointTest);
  });

  describe('As admin', () => {
    describe('Institution created by admin', () => {
      let institutionId;
      beforeAll(async () => {
        institutionId = await createInstitutionAsAdmin(institutionTest);
      });

      describe('Unvalidated institution', () => {
        describe('POST /sushi - Create sushi', () => {
          let sushiId;
          beforeAll(async () => {
            sushiTest.endpointId = endpointId;
            sushiTest.institutionId = institutionId;
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

            const sushi = res?.data;
            expect(sushi).toHaveProperty('id', sushiId);
            expect(sushi?.createdAt).not.toBeNull();
            expect(sushi?.updatedAt).not.toBeNull();
            expect(sushi).toHaveProperty('institutionId', sushiTest?.institutionId);
            expect(sushi).toHaveProperty('endpointId', sushiTest?.endpointId);
            expect(sushi).toHaveProperty('customerId', sushiTest?.customerId);
            expect(sushi).toHaveProperty('requestorId', sushiTest?.requestorId);
            expect(sushi).toHaveProperty('apiKey', sushiTest?.apiKey);
            expect(sushi).toHaveProperty('comment', sushiTest?.comment);
            expect(sushi).toHaveProperty('tags', sushiTest?.tags);
            expect(sushi).toHaveProperty('params', sushiTest?.params);
            expect(sushi?.endpoint).not.toBeNull();
          });

          afterAll(async () => {
            await deleteSushiAsAdmin(sushiId);
          });
        });
      });

      describe('Validated institution', () => {
        beforeAll(async () => {
          await validateInstitutionAsAdmin(institutionId);
        });
        describe('POST /sushi - Create sushi', () => {
          let sushiId;
          beforeAll(async () => {
            sushiTest.endpointId = endpointId;
            sushiTest.institutionId = institutionId;
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

            const sushi = res?.data;
            expect(sushi).toHaveProperty('id', sushiId);
            expect(sushi?.createdAt).not.toBeNull();
            expect(sushi?.updatedAt).not.toBeNull();
            expect(sushi).toHaveProperty('institutionId', sushiTest?.institutionId);
            expect(sushi).toHaveProperty('endpointId', sushiTest?.endpointId);
            expect(sushi).toHaveProperty('customerId', sushiTest?.customerId);
            expect(sushi).toHaveProperty('requestorId', sushiTest?.requestorId);
            expect(sushi).toHaveProperty('apiKey', sushiTest?.apiKey);
            expect(sushi).toHaveProperty('comment', sushiTest?.comment);
            expect(sushi).toHaveProperty('tags', sushiTest?.tags);
            expect(sushi).toHaveProperty('params', sushiTest?.params);
            expect(sushi?.endpoint).not.toBeNull();
          });

          afterAll(async () => {
            await deleteSushiAsAdmin(sushiId);
          });
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

      describe('Unvalidated institution', () => {
        describe('POST /sushi - Create sushi', () => {
          let sushiId;
          beforeAll(async () => {
            sushiTest.endpointId = endpointId;
            sushiTest.institutionId = institutionId;
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

            const sushi = res?.data;
            expect(sushi).toHaveProperty('id', sushiId);
            expect(sushi?.createdAt).not.toBeNull();
            expect(sushi?.updatedAt).not.toBeNull();
            expect(sushi).toHaveProperty('institutionId', sushiTest?.institutionId);
            expect(sushi).toHaveProperty('endpointId', sushiTest?.endpointId);
            expect(sushi).toHaveProperty('customerId', sushiTest?.customerId);
            expect(sushi).toHaveProperty('requestorId', sushiTest?.requestorId);
            expect(sushi).toHaveProperty('apiKey', sushiTest?.apiKey);
            expect(sushi).toHaveProperty('comment', sushiTest?.comment);
            expect(sushi).toHaveProperty('tags', sushiTest?.tags);
            expect(sushi).toHaveProperty('params', sushiTest?.params);
            expect(sushi?.endpoint).not.toBeNull();
          });

          afterAll(async () => {
            await deleteSushiAsAdmin(sushiId);
          });
        });
      });

      describe('Validated institution', () => {
        beforeAll(async () => {
          await validateInstitutionAsAdmin(institutionId);
        });
        describe('POST /sushi - Create sushi', () => {
          let sushiId;
          beforeAll(async () => {
            sushiTest.endpointId = endpointId;
            sushiTest.institutionId = institutionId;
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

            const sushi = res?.data;
            expect(sushi).toHaveProperty('id', sushiId);
            expect(sushi?.createdAt).not.toBeNull();
            expect(sushi?.updatedAt).not.toBeNull();
            expect(sushi).toHaveProperty('institutionId', sushiTest?.institutionId);
            expect(sushi).toHaveProperty('endpointId', sushiTest?.endpointId);
            expect(sushi).toHaveProperty('customerId', sushiTest?.customerId);
            expect(sushi).toHaveProperty('requestorId', sushiTest?.requestorId);
            expect(sushi).toHaveProperty('apiKey', sushiTest?.apiKey);
            expect(sushi).toHaveProperty('comment', sushiTest?.comment);
            expect(sushi).toHaveProperty('tags', sushiTest?.tags);
            expect(sushi).toHaveProperty('params', sushiTest?.params);
            expect(sushi?.endpoint).not.toBeNull();
          });

          afterAll(async () => {
            await deleteSushiAsAdmin(sushiId);
          });
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

      describe('Unvalidated institution', () => {
        describe('POST /sushi - Create sushi', () => {
          beforeAll(async () => {
            sushiTest.endpointId = endpointId;
            sushiTest.institutionId = institutionId;
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
        });
      });

      describe('Validated institution', () => {
        beforeAll(async () => {
          await validateInstitutionAsAdmin(institutionId);
        });
        describe('POST /sushi - Create sushi', () => {
          beforeAll(async () => {
            sushiTest.endpointId = endpointId;
            sushiTest.institutionId = institutionId;
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
        await validateInstitutionAsAdmin(institutionId);
      });

      describe('Unvalidated institution', () => {
        describe('User with memberships [sushi:write, sushi:read]', () => {
          beforeAll(async () => {
            await addMembershipsToUserAsAdmin(institutionId, userTest.username, ['sushi:write', 'sushi:read']);
          });
          describe('POST /sushi - Create new sushi', () => {
            let sushiId;
            beforeAll(async () => {
              sushiTest.endpointId = endpointId;
              sushiTest.institutionId = institutionId;
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

              const sushi = res?.data;
              expect(sushi).toHaveProperty('id', sushiId);
              expect(sushi?.createdAt).not.toBeNull();
              expect(sushi?.updatedAt).not.toBeNull();
              expect(sushi).toHaveProperty('institutionId', sushiTest?.institutionId);
              expect(sushi).toHaveProperty('endpointId', sushiTest?.endpointId);
              expect(sushi).toHaveProperty('customerId', sushiTest?.customerId);
              expect(sushi).toHaveProperty('requestorId', sushiTest?.requestorId);
              expect(sushi).toHaveProperty('apiKey', sushiTest?.apiKey);
              expect(sushi).toHaveProperty('comment', sushiTest?.comment);
              expect(sushi).toHaveProperty('tags', sushiTest?.tags);
              expect(sushi).toHaveProperty('params', sushiTest?.params);
              expect(sushi?.endpoint).not.toBeNull();
            });

            afterAll(async () => {
              await deleteSushiAsAdmin(sushiId);
            });
          });
          afterAll(async () => {
            await deleteMembershipsToUserAsAdmin(institutionId, userTest.username);
          });
        });

        describe('User with memberships [sushi:read]', () => {
          beforeAll(async () => {
            await addMembershipsToUserAsAdmin(institutionId, userTest.username, ['sushi:read']);
          });
          describe('POST /sushi - Create new sushi', () => {
            beforeAll(async () => {
              sushiTest.endpointId = endpointId;
              sushiTest.institutionId = institutionId;
            });

            it('Should get HTTP status 403', async () => {
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
          });

          afterAll(async () => {
            await deleteMembershipsToUserAsAdmin(institutionId, userTest.username);
          });
        });
      });

      describe('Validated institution', () => {
        beforeAll(async () => {
          await validateInstitutionAsAdmin(institutionId);
        });
        describe('User with memberships [sushi:write, sushi:read]', () => {
          beforeAll(async () => {
            await addMembershipsToUserAsAdmin(institutionId, userTest.username, ['sushi:write', 'sushi:read']);
          });
          describe('POST /sushi - Create new sushi', () => {
            let sushiId;
            beforeAll(async () => {
              sushiTest.endpointId = endpointId;
              sushiTest.institutionId = institutionId;
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

              const sushi = res?.data;
              expect(sushi).toHaveProperty('id', sushiId);
              expect(sushi?.createdAt).not.toBeNull();
              expect(sushi?.updatedAt).not.toBeNull();
              expect(sushi).toHaveProperty('institutionId', sushiTest?.institutionId);
              expect(sushi).toHaveProperty('endpointId', sushiTest?.endpointId);
              expect(sushi).toHaveProperty('customerId', sushiTest?.customerId);
              expect(sushi).toHaveProperty('requestorId', sushiTest?.requestorId);
              expect(sushi).toHaveProperty('apiKey', sushiTest?.apiKey);
              expect(sushi).toHaveProperty('comment', sushiTest?.comment);
              expect(sushi).toHaveProperty('tags', sushiTest?.tags);
              expect(sushi).toHaveProperty('params', sushiTest?.params);
              expect(sushi?.endpoint).not.toBeNull();
            });

            afterAll(async () => {
              await deleteSushiAsAdmin(sushiId);
            });
          });
          afterAll(async () => {
            await deleteMembershipsToUserAsAdmin(institutionId, userTest.username);
          });
        });

        describe('User with memberships [sushi:read]', () => {
          beforeAll(async () => {
            await addMembershipsToUserAsAdmin(institutionId, userTest.username, ['sushi:read']);
          });
          describe('POST /sushi - Create new sushi', () => {
            beforeAll(async () => {
              sushiTest.endpointId = endpointId;
              sushiTest.institutionId = institutionId;
            });

            it('Should get HTTP status 403', async () => {
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
          });

          afterAll(async () => {
            await deleteMembershipsToUserAsAdmin(institutionId, userTest.username);
          });
        });
      });

      afterAll(async () => {
        await deleteInstitutionAsAdmin(institutionId);
      });
    });
    describe('Institution created by another user', () => {
      let anotherUserTestInstitutionId;
      let userTestInstitutionId;

      const anotherUserTest = {
        username: 'another.user',
        email: 'another.user@test.fr',
        fullName: 'Another user',
        isAdmin: false,
        password: 'changeme',
        permissions: ['memberships:write', 'memberships:read'],
      };

      beforeAll(async () => {
        await createUserAsAdmin(
          anotherUserTest.username,
          anotherUserTest.email,
          anotherUserTest.fullName,
          anotherUserTest.isAdmin,
        );
        await activateUser(
          anotherUserTest.username,
          anotherUserTest.password,
        );
        anotherUserTestInstitutionId = await createInstitution(institutionTest, anotherUserTest);
        await validateInstitutionAsAdmin(anotherUserTestInstitutionId);
        userTestInstitutionId = await createInstitution(institutionTest, userTest);
        await validateInstitutionAsAdmin(userTestInstitutionId);
      });

      describe('Unvalidated institution', () => {
        describe('User with memberships [sushi:write, sushi:read]', () => {
          beforeAll(async () => {
            await addMembershipsToUserAsAdmin(userTestInstitutionId, userTest.username, ['sushi:write', 'sushi:read']);
          });
          describe('POST /sushi - Create new sushi', () => {
            beforeAll(async () => {
              sushiTest.endpointId = endpointId;
              sushiTest.institutionId = anotherUserTestInstitutionId;
            });

            it('Should get HTTP status 403', async () => {
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
          });
          afterAll(async () => {
            await deleteMembershipsToUserAsAdmin(userTestInstitutionId, userTest.username);
          });
        });

        describe('User with memberships [sushi:read]', () => {
          beforeAll(async () => {
            await addMembershipsToUserAsAdmin(userTestInstitutionId, userTest.username, ['sushi:read']);
          });
          describe('POST /sushi - Create new sushi', () => {
            beforeAll(async () => {
              sushiTest.endpointId = endpointId;
              sushiTest.institutionId = anotherUserTestInstitutionId;
            });

            it('Should get HTTP status 403', async () => {
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
          });

          afterAll(async () => {
            await deleteMembershipsToUserAsAdmin(userTestInstitutionId, userTest.username);
          });
        });
      });

      describe('Validated institution', () => {
        beforeAll(async () => {
          await validateInstitutionAsAdmin(anotherUserTestInstitutionId);
          await validateInstitutionAsAdmin(userTestInstitutionId);
        });
        describe('User with memberships [sushi:write, sushi:read]', () => {
          beforeAll(async () => {
            await addMembershipsToUserAsAdmin(userTestInstitutionId, userTest.username, ['sushi:write', 'sushi:read']);
          });
          describe('POST /sushi - Create new sushi', () => {
            beforeAll(async () => {
              sushiTest.endpointId = endpointId;
              sushiTest.institutionId = anotherUserTestInstitutionId;
            });

            it('Should get HTTP status 403', async () => {
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
          });
          afterAll(async () => {
            await deleteMembershipsToUserAsAdmin(userTestInstitutionId, userTest.username);
          });
        });

        describe('User with memberships [sushi:read]', () => {
          beforeAll(async () => {
            await addMembershipsToUserAsAdmin(userTestInstitutionId, userTest.username, ['sushi:read']);
          });
          describe('POST /sushi - Create new sushi', () => {
            beforeAll(async () => {
              sushiTest.endpointId = endpointId;
              sushiTest.institutionId = anotherUserTestInstitutionId;
            });

            it('Should get HTTP status 403', async () => {
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
          });

          afterAll(async () => {
            await deleteMembershipsToUserAsAdmin(userTestInstitutionId, userTest.username);
          });
        });
      });

      afterAll(async () => {
        await deleteUserAsAdmin(anotherUserTest.username);
        await deleteInstitutionAsAdmin(anotherUserTestInstitutionId);
        await deleteInstitutionAsAdmin(userTestInstitutionId);
      });
    });

    afterAll(async () => {
      await deleteUserAsAdmin(userTest.username);
    });
  });
  describe('Without token', () => {
    describe('Institution created by admin', () => {
      let institutionId;
      beforeAll(async () => {
        institutionId = await createInstitutionAsAdmin(institutionTest);
      });

      describe('Unvalidated institution', () => {
        describe('POST /sushi - Create sushi', () => {
          beforeAll(async () => {
            sushiTest.endpointId = endpointId;
            sushiTest.institutionId = institutionId;
          });

          it('Should HTTP status 401', async () => {
            const res = await ezmesure({
              method: 'POST',
              url: '/sushi',
              data: sushiTest,
            });
            expect(res).toHaveProperty('status', 401);
          });
        });
        afterAll(async () => {
          await deleteInstitutionAsAdmin(institutionId);
        });
      });

      describe('Validated institution', () => {
        beforeAll(async () => {
          await validateInstitutionAsAdmin(institutionId);
        });
        describe('POST /sushi - Create sushi', () => {
          beforeAll(async () => {
            sushiTest.endpointId = endpointId;
            sushiTest.institutionId = institutionId;
          });

          it('Should HTTP status 401', async () => {
            const res = await ezmesure({
              method: 'POST',
              url: '/sushi',
              data: sushiTest,
            });
            expect(res).toHaveProperty('status', 401);
          });
        });
        afterAll(async () => {
          await deleteInstitutionAsAdmin(institutionId);
        });
      });
    });
  });
  afterAll(async () => {
    await deleteSushiEndpointAsAdmin(endpointId);
  });
});

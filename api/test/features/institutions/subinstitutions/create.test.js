/* eslint-disable max-len */

const {
  createInstitution,
  createInstitutionAsAdmin,
  validateInstitutionAsAdmin,
  deleteInstitutionAsAdmin,
} = require('../../../setup/institutions');
const { createUserAsAdmin, activateUser, deleteUserAsAdmin } = require('../../../setup/users');
const { getToken, getAdminToken } = require('../../../setup/login');

const { testCreateSubInstitution } = require('./utils');

describe('[institutions - subinstitution]: Test create features', () => {
  const masterInstitutionTest = {
    name: 'Master Test',
    namespace: 'master-test',
  };
  const subInstitutionTest = {
    name: 'Sub Test',
    namespace: 'sub-test',
  };

  const userTest = {
    username: 'user.test',
    email: 'user.test@test.fr',
    fullName: 'User test',
    isAdmin: false,
    password: 'changeme',
  };

  const anotherUserTest = {
    username: 'another.user',
    email: 'another.user@test.fr',
    fullName: 'Another user',
    isAdmin: false,
    password: 'changeme',
  };

  let adminToken;
  let userToken;
  let masterInstitutionId;
  let subInstitutionId;

  beforeAll(async () => {
    adminToken = await getAdminToken();
    await createUserAsAdmin(
      userTest.username,
      userTest.email,
      userTest.fullName,
      userTest.isAdmin,
    );
    await activateUser(userTest.username, userTest.password);
    userToken = await getToken(userTest.username, userTest.password);

    await createUserAsAdmin(
      anotherUserTest.username,
      anotherUserTest.email,
      anotherUserTest.fullName,
      anotherUserTest.isAdmin,
    );
    await activateUser(anotherUserTest.username, anotherUserTest.password);
  });

  describe('As admin', () => {
    describe('With master institution created by admin', () => {
      beforeAll(async () => {
        masterInstitutionId = await createInstitutionAsAdmin(masterInstitutionTest);
        await validateInstitutionAsAdmin(masterInstitutionId);
      });

      describe('With sub institution created by admin', () => {
        beforeAll(async () => {
          subInstitutionId = await createInstitutionAsAdmin(subInstitutionTest);
          await validateInstitutionAsAdmin(subInstitutionId);
        });
        describe('PUT /institutions/<id>/subinstitution/<subid> - Create subinstitution [Sub Test] for [Master Test] institution', () => {
          it('Should create subinstitution', async () => {
            const testConfig = {
              masterInstitutionId,
              subInstitutionId,
              token: adminToken,
              subInstitutionIsValidated: true,
              subInstitutionCreatedByAdmin: true,
              expectedHTTPStatus: 200,
            };
            await testCreateSubInstitution(testConfig);
          });
        });
        afterAll(async () => {
          await deleteInstitutionAsAdmin(subInstitutionId);
        });
      });

      describe('With sub institution created by user', () => {
        beforeAll(async () => {
          subInstitutionId = await createInstitution(subInstitutionTest, userTest);
          await validateInstitutionAsAdmin(subInstitutionId);
        });
        describe('PUT /institutions/<id>/subinstitution/<subid> - Create subinstitution [Sub Test] for [Master Test] institution', () => {
          it('Should create subinstitution', async () => {
            const testConfig = {
              masterInstitutionId,
              subInstitutionId,
              token: adminToken,
              subInstitutionIsValidated: true,
              subInstitutionCreatedByAdmin: false,
              expectedHTTPStatus: 200,
            };
            await testCreateSubInstitution(testConfig);
          });
        });
        afterAll(async () => {
          await deleteInstitutionAsAdmin(subInstitutionId);
        });
      });

      afterAll(async () => {
        await deleteInstitutionAsAdmin(masterInstitutionId);
      });
    });

    describe('With master institution created by user', () => {
      beforeAll(async () => {
        masterInstitutionId = await createInstitution(masterInstitutionTest, userTest);
        await validateInstitutionAsAdmin(masterInstitutionId);
      });
      describe('With sub institution created by admin', () => {
        beforeAll(async () => {
          subInstitutionId = await createInstitutionAsAdmin(subInstitutionTest);
          await validateInstitutionAsAdmin(subInstitutionId);
        });
        describe('PUT /institutions/<id>/subinstitution/<subid> - Create subinstitution [Sub Test] for [Master Test] institution', () => {
          it('Should create subinstitution', async () => {
            const testConfig = {
              masterInstitutionId,
              subInstitutionId,
              token: adminToken,
              subInstitutionIsValidated: true,
              subInstitutionCreatedByAdmin: true,
              expectedHTTPStatus: 200,
            };
            await testCreateSubInstitution(testConfig);
          });
        });
        afterAll(async () => {
          await deleteInstitutionAsAdmin(subInstitutionId);
        });
      });

      describe('With sub institution created by user', () => {
        beforeAll(async () => {
          subInstitutionId = await createInstitution(subInstitutionTest, userTest);
          await validateInstitutionAsAdmin(subInstitutionId);
        });
        describe('PUT /institutions/<id>/subinstitution/<subid> - Create subinstitution [Sub Test] for [Master Test] institution', () => {
          it('Should create subinstitution', async () => {
            const testConfig = {
              masterInstitutionId,
              subInstitutionId,
              token: adminToken,
              subInstitutionIsValidated: true,
              subInstitutionCreatedByAdmin: false,
              expectedHTTPStatus: 200,
            };
            await testCreateSubInstitution(testConfig);
          });
        });
        afterAll(async () => {
          await deleteInstitutionAsAdmin(subInstitutionId);
        });
      });

      describe('With sub institution created by another user', () => {
        beforeAll(async () => {
          subInstitutionId = await createInstitution(subInstitutionTest, anotherUserTest);
          await validateInstitutionAsAdmin(subInstitutionId);
        });
        describe('PUT /institutions/<id>/subinstitution/<subid> - Create subinstitution [Sub Test] for [Master Test] institution', () => {
          it('Should create subinstitution', async () => {
            const testConfig = {
              masterInstitutionId,
              subInstitutionId,
              token: adminToken,
              subInstitutionIsValidated: true,
              subInstitutionCreatedByAdmin: false,
              expectedHTTPStatus: 200,
            };
            await testCreateSubInstitution(testConfig);
          });
        });
        afterAll(async () => {
          await deleteInstitutionAsAdmin(subInstitutionId);
        });
      });

      afterAll(async () => {
        await deleteInstitutionAsAdmin(masterInstitutionId);
      });
    });

    describe('With master institution created by another user', () => {
      beforeAll(async () => {
        masterInstitutionId = await createInstitution(masterInstitutionTest, anotherUserTest);
        await validateInstitutionAsAdmin(masterInstitutionId);
      });
      describe('With sub institution created by admin', () => {
        beforeAll(async () => {
          subInstitutionId = await createInstitutionAsAdmin(subInstitutionTest);
          await validateInstitutionAsAdmin(subInstitutionId);
        });
        describe('PUT /institutions/<id>/subinstitution/<subid> - Create subinstitution [Sub Test] for [Master Test] institution', () => {
          it('Should create subinstitution', async () => {
            const testConfig = {
              masterInstitutionId,
              subInstitutionId,
              token: adminToken,
              subInstitutionIsValidated: true,
              subInstitutionCreatedByAdmin: true,
              expectedHTTPStatus: 200,
            };
            await testCreateSubInstitution(testConfig);
          });
        });
        afterAll(async () => {
          await deleteInstitutionAsAdmin(subInstitutionId);
        });
      });

      describe('With sub institution created by user', () => {
        beforeAll(async () => {
          subInstitutionId = await createInstitution(subInstitutionTest, userTest);
          await validateInstitutionAsAdmin(subInstitutionId);
        });
        describe('PUT /institutions/<id>/subinstitution/<subid> - Create subinstitution [Sub Test] for [Master Test] institution', () => {
          it('Should create subinstitution', async () => {
            const testConfig = {
              masterInstitutionId,
              subInstitutionId,
              token: adminToken,
              subInstitutionIsValidated: true,
              subInstitutionCreatedByAdmin: false,
              expectedHTTPStatus: 200,
            };
            await testCreateSubInstitution(testConfig);
          });
        });
        afterAll(async () => {
          await deleteInstitutionAsAdmin(subInstitutionId);
        });
      });

      describe('With sub institution created by another user', () => {
        beforeAll(async () => {
          subInstitutionId = await createInstitution(subInstitutionTest, anotherUserTest);
          await validateInstitutionAsAdmin(subInstitutionId);
        });
        describe('PUT /institutions/<id>/subinstitution/<subid> - Create subinstitution [Sub Test] for [Master Test] institution', () => {
          it('Should create subinstitution', async () => {
            const testConfig = {
              masterInstitutionId,
              subInstitutionId,
              token: adminToken,
              subInstitutionIsValidated: true,
              subInstitutionCreatedByAdmin: false,
              expectedHTTPStatus: 200,
            };
            await testCreateSubInstitution(testConfig);
          });
        });
        afterAll(async () => {
          await deleteInstitutionAsAdmin(subInstitutionId);
        });
      });

      afterAll(async () => {
        await deleteInstitutionAsAdmin(masterInstitutionId);
      });
    });
  });
  describe('As User', () => {
    describe('With master institution created by admin', () => {
      beforeAll(async () => {
        masterInstitutionId = await createInstitutionAsAdmin(masterInstitutionTest);
        await validateInstitutionAsAdmin(masterInstitutionId);
      });
      describe('With sub institution created by admin', () => {
        beforeAll(async () => {
          subInstitutionId = await createInstitutionAsAdmin(subInstitutionTest);
          await validateInstitutionAsAdmin(subInstitutionId);
        });
        describe('PUT /institutions/<id>/subinstitution/<subid> - Create subinstitution [Sub Test] for [Master Test] institution', () => {
          it('Should get HTTP status 403', async () => {
            const testConfig = {
              masterInstitutionId,
              subInstitutionId,
              token: userToken,
              subInstitutionIsValidated: true,
              subInstitutionCreatedByAdmin: true,
              expectedHTTPStatus: 403,
            };
            await testCreateSubInstitution(testConfig);
          });
        });
        afterAll(async () => {
          await deleteInstitutionAsAdmin(subInstitutionId);
        });
      });

      describe('With sub institution created by user', () => {
        beforeAll(async () => {
          subInstitutionId = await createInstitution(subInstitutionTest, userTest);
          await validateInstitutionAsAdmin(subInstitutionId);
        });
        describe('PUT /institutions/<id>/subinstitution/<subid> - Create subinstitution [Sub Test] for [Master Test] institution', () => {
          it('Should get HTTP status 403', async () => {
            const testConfig = {
              masterInstitutionId,
              subInstitutionId,
              token: userToken,
              subInstitutionIsValidated: true,
              subInstitutionCreatedByAdmin: false,
              expectedHTTPStatus: 403,
            };
            await testCreateSubInstitution(testConfig);
          });
        });
        afterAll(async () => {
          await deleteInstitutionAsAdmin(subInstitutionId);
        });
      });

      afterAll(async () => {
        await deleteInstitutionAsAdmin(masterInstitutionId);
      });
    });

    describe('With master institution created by user', () => {
      beforeAll(async () => {
        masterInstitutionId = await createInstitution(masterInstitutionTest, userTest);
        await validateInstitutionAsAdmin(masterInstitutionId);
      });

      describe('With sub institution created by admin', () => {
        beforeAll(async () => {
          subInstitutionId = await createInstitutionAsAdmin(subInstitutionTest);
          await validateInstitutionAsAdmin(subInstitutionId);
        });

        describe('PUT /institutions/<id>/subinstitution/<subid> - Create subinstitution [Sub Test] for [Master Test] institution', () => {
          it('Should get HTTP status 403', async () => {
            const testConfig = {
              masterInstitutionId,
              subInstitutionId,
              token: userToken,
              subInstitutionIsValidated: true,
              subInstitutionCreatedByAdmin: true,
              expectedHTTPStatus: 403,
            };
            await testCreateSubInstitution(testConfig);
          });
        });
        afterAll(async () => {
          await deleteInstitutionAsAdmin(subInstitutionId);
        });
      });

      describe('With sub institution created by user', () => {
        beforeAll(async () => {
          subInstitutionId = await createInstitution(subInstitutionTest, userTest);
          await validateInstitutionAsAdmin(subInstitutionId);
        });
        describe('PUT /institutions/<id>/subinstitution/<subid> - Create subinstitution [Sub Test] for [Master Test] institution', () => {
          it('Should get HTTP status 403', async () => {
            const testConfig = {
              masterInstitutionId,
              subInstitutionId,
              token: userToken,
              subInstitutionIsValidated: true,
              subInstitutionCreatedByAdmin: false,
              expectedHTTPStatus: 403,
            };
            await testCreateSubInstitution(testConfig);
          });
        });
        afterAll(async () => {
          await deleteInstitutionAsAdmin(subInstitutionId);
        });
      });

      describe('With sub institution created by another user', () => {
        beforeAll(async () => {
          subInstitutionId = await createInstitution(subInstitutionTest, anotherUserTest);
          await validateInstitutionAsAdmin(subInstitutionId);
        });
        describe('PUT /institutions/<id>/subinstitution/<subid> - Create subinstitution [Sub Test] for [Master Test] institution', () => {
          it('Should get HTTP status 403', async () => {
            const testConfig = {
              masterInstitutionId,
              subInstitutionId,
              token: userToken,
              subInstitutionIsValidated: true,
              subInstitutionCreatedByAdmin: false,
              expectedHTTPStatus: 403,
            };
            await testCreateSubInstitution(testConfig);
          });
        });
        afterAll(async () => {
          await deleteInstitutionAsAdmin(subInstitutionId);
        });
      });

      afterAll(async () => {
        await deleteInstitutionAsAdmin(masterInstitutionId);
      });
    });

    describe('With master institution created by another user', () => {
      beforeAll(async () => {
        masterInstitutionId = await createInstitution(masterInstitutionTest, anotherUserTest);
        await validateInstitutionAsAdmin(masterInstitutionId);
      });
      describe('With sub institution created by admin', () => {
        beforeAll(async () => {
          subInstitutionId = await createInstitutionAsAdmin(subInstitutionTest);
          await validateInstitutionAsAdmin(subInstitutionId);
        });
        describe('PUT /institutions/<id>/subinstitution/<subid> - Create subinstitution [Sub Test] for [Master Test] institution', () => {
          it('Should get HTTP status 403', async () => {
            const testConfig = {
              masterInstitutionId,
              subInstitutionId,
              token: userToken,
              subInstitutionIsValidated: true,
              subInstitutionCreatedByAdmin: true,
              expectedHTTPStatus: 403,
            };
            await testCreateSubInstitution(testConfig);
          });
        });
        afterAll(async () => {
          await deleteInstitutionAsAdmin(subInstitutionId);
        });
      });

      describe('With sub institution created by user', () => {
        beforeAll(async () => {
          subInstitutionId = await createInstitution(subInstitutionTest, userTest);
          await validateInstitutionAsAdmin(subInstitutionId);
        });
        describe('PUT /institutions/<id>/subinstitution/<subid> - Create subinstitution [Sub Test] for [Master Test] institution', () => {
          it('Should get HTTP status 403', async () => {
            const testConfig = {
              masterInstitutionId,
              subInstitutionId,
              token: userToken,
              subInstitutionIsValidated: true,
              subInstitutionCreatedByAdmin: false,
              expectedHTTPStatus: 403,
            };
            await testCreateSubInstitution(testConfig);
          });
        });
        afterAll(async () => {
          await deleteInstitutionAsAdmin(subInstitutionId);
        });
      });

      describe('With sub institution created by another user', () => {
        beforeAll(async () => {
          subInstitutionId = await createInstitution(subInstitutionTest, anotherUserTest);
          await validateInstitutionAsAdmin(subInstitutionId);
        });
        describe('PUT /institutions/<id>/subinstitution/<subid> - Create subinstitution [Sub Test] for [Master Test] institution', () => {
          it('Should get HTTP status 403', async () => {
            const testConfig = {
              masterInstitutionId,
              subInstitutionId,
              token: userToken,
              subInstitutionIsValidated: true,
              subInstitutionCreatedByAdmin: false,
              expectedHTTPStatus: 403,
            };
            await testCreateSubInstitution(testConfig);
          });
        });
        afterAll(async () => {
          await deleteInstitutionAsAdmin(subInstitutionId);
        });
      });

      afterAll(async () => {
        await deleteInstitutionAsAdmin(masterInstitutionId);
      });
    });
  });
  describe('Without token', () => {
    describe('With master institution created by admin', () => {
      beforeAll(async () => {
        masterInstitutionId = await createInstitutionAsAdmin(masterInstitutionTest);
        await validateInstitutionAsAdmin(masterInstitutionId);
      });
      describe('With sub institution created by admin', () => {
        beforeAll(async () => {
          subInstitutionId = await createInstitutionAsAdmin(subInstitutionTest);
          await validateInstitutionAsAdmin(subInstitutionId);
        });
        describe('PUT /institutions/<id>/subinstitution/<subid> - Create subinstitution [Sub Test] for [Master Test] institution', () => {
          it('Should get HTTP status 401', async () => {
            const testConfig = {
              masterInstitutionId,
              subInstitutionId,
              token: undefined,
              subInstitutionIsValidated: true,
              subInstitutionCreatedByAdmin: true,
              expectedHTTPStatus: 401,
            };
            await testCreateSubInstitution(testConfig);
          });
        });
        afterAll(async () => {
          await deleteInstitutionAsAdmin(subInstitutionId);
        });
      });

      describe('With sub institution created by user', () => {
        beforeAll(async () => {
          subInstitutionId = await createInstitution(subInstitutionTest, userTest);
          await validateInstitutionAsAdmin(subInstitutionId);
        });
        describe('PUT /institutions/<id>/subinstitution/<subid> - Create subinstitution [Sub Test] for [Master Test] institution', () => {
          it('Should get HTTP status 401', async () => {
            const testConfig = {
              masterInstitutionId,
              subInstitutionId,
              token: undefined,
              subInstitutionIsValidated: true,
              subInstitutionCreatedByAdmin: false,
              expectedHTTPStatus: 401,
            };
            await testCreateSubInstitution(testConfig);
          });
        });
        afterAll(async () => {
          await deleteInstitutionAsAdmin(subInstitutionId);
        });
      });

      afterAll(async () => {
        await deleteInstitutionAsAdmin(masterInstitutionId);
      });
    });

    describe('With master institution created by user', () => {
      beforeAll(async () => {
        masterInstitutionId = await createInstitution(masterInstitutionTest, userTest);
        await validateInstitutionAsAdmin(masterInstitutionId);
      });

      describe('With sub institution created by admin', () => {
        beforeAll(async () => {
          subInstitutionId = await createInstitutionAsAdmin(subInstitutionTest);
          await validateInstitutionAsAdmin(subInstitutionId);
        });
        describe('PUT /institutions/<id>/subinstitution/<subid> - Create subinstitution [Sub Test] for [Master Test] institution', () => {
          it('Should get HTTP status 401', async () => {
            const testConfig = {
              masterInstitutionId,
              subInstitutionId,
              token: undefined,
              subInstitutionIsValidated: true,
              subInstitutionCreatedByAdmin: true,
              expectedHTTPStatus: 401,
            };
            await testCreateSubInstitution(testConfig);
          });
        });
        afterAll(async () => {
          await deleteInstitutionAsAdmin(subInstitutionId);
        });
      });

      describe('With sub institution created by user', () => {
        beforeAll(async () => {
          subInstitutionId = await createInstitution(subInstitutionTest, userTest);
          await validateInstitutionAsAdmin(subInstitutionId);
        });
        describe('PUT /institutions/<id>/subinstitution/<subid> - Create subinstitution [Sub Test] for [Master Test] institution', () => {
          it('Should get HTTP status 401', async () => {
            const testConfig = {
              masterInstitutionId,
              subInstitutionId,
              token: undefined,
              subInstitutionIsValidated: true,
              subInstitutionCreatedByAdmin: false,
              expectedHTTPStatus: 401,
            };
            await testCreateSubInstitution(testConfig);
          });
        });
        afterAll(async () => {
          await deleteInstitutionAsAdmin(subInstitutionId);
        });
      });

      describe('With sub institution created by another user', () => {
        beforeAll(async () => {
          subInstitutionId = await createInstitution(subInstitutionTest, anotherUserTest);
          await validateInstitutionAsAdmin(subInstitutionId);
        });
        describe('PUT /institutions/<id>/subinstitution/<subid> - Create subinstitution [Sub Test] for [Master Test] institution', () => {
          it('Should get HTTP status 401', async () => {
            const testConfig = {
              masterInstitutionId,
              subInstitutionId,
              token: undefined,
              subInstitutionIsValidated: true,
              subInstitutionCreatedByAdmin: false,
              expectedHTTPStatus: 401,
            };
            await testCreateSubInstitution(testConfig);
          });
        });
        afterAll(async () => {
          await deleteInstitutionAsAdmin(subInstitutionId);
        });
      });

      afterAll(async () => {
        await deleteInstitutionAsAdmin(masterInstitutionId);
      });
    });

    describe('With master institution created by another user', () => {
      beforeAll(async () => {
        masterInstitutionId = await createInstitution(masterInstitutionTest, anotherUserTest);
        await validateInstitutionAsAdmin(masterInstitutionId);
      });
      describe('With sub institution created by admin', () => {
        beforeAll(async () => {
          subInstitutionId = await createInstitutionAsAdmin(subInstitutionTest);
          await validateInstitutionAsAdmin(subInstitutionId);
        });
        describe('PUT /institutions/<id>/subinstitution/<subid> - Create subinstitution [Sub Test] for [Master Test] institution', () => {
          it('Should get HTTP status 401', async () => {
            const testConfig = {
              masterInstitutionId,
              subInstitutionId,
              token: undefined,
              subInstitutionIsValidated: true,
              subInstitutionCreatedByAdmin: true,
              expectedHTTPStatus: 401,
            };
            await testCreateSubInstitution(testConfig);
          });
        });
        afterAll(async () => {
          await deleteInstitutionAsAdmin(subInstitutionId);
        });
      });

      describe('With sub institution created by user', () => {
        beforeAll(async () => {
          subInstitutionId = await createInstitution(subInstitutionTest, userTest);
          await validateInstitutionAsAdmin(subInstitutionId);
        });
        describe('PUT /institutions/<id>/subinstitution/<subid> - Create subinstitution [Sub Test] for [Master Test] institution', () => {
          it('Should get HTTP status 401', async () => {
            const testConfig = {
              masterInstitutionId,
              subInstitutionId,
              token: undefined,
              subInstitutionIsValidated: true,
              subInstitutionCreatedByAdmin: false,
              expectedHTTPStatus: 401,
            };
            await testCreateSubInstitution(testConfig);
          });
        });
        afterAll(async () => {
          await deleteInstitutionAsAdmin(subInstitutionId);
        });
      });

      describe('With sub institution created by another user', () => {
        beforeAll(async () => {
          subInstitutionId = await createInstitution(subInstitutionTest, anotherUserTest);
          await validateInstitutionAsAdmin(subInstitutionId);
        });
        describe('PUT /institutions/<id>/subinstitution/<subid> - Create subinstitution [Sub Test] for [Master Test] institution', () => {
          it('Should get HTTP status 401', async () => {
            const testConfig = {
              masterInstitutionId,
              subInstitutionId,
              token: undefined,
              subInstitutionIsValidated: true,
              subInstitutionCreatedByAdmin: false,
              expectedHTTPStatus: 401,
            };
            await testCreateSubInstitution(testConfig);
          });
        });
        afterAll(async () => {
          await deleteInstitutionAsAdmin(subInstitutionId);
        });
      });

      afterAll(async () => {
        await deleteInstitutionAsAdmin(masterInstitutionId);
      });
    });
  });
  describe('With random token', () => {
    describe('With master institution created by admin', () => {
      beforeAll(async () => {
        masterInstitutionId = await createInstitutionAsAdmin(masterInstitutionTest);
        await validateInstitutionAsAdmin(masterInstitutionId);
      });
      describe('With sub institution created by admin', () => {
        beforeAll(async () => {
          subInstitutionId = await createInstitutionAsAdmin(subInstitutionTest);
          await validateInstitutionAsAdmin(subInstitutionId);
        });
        describe('PUT /institutions/<id>/subinstitution/<subid> - Create subinstitution [Sub Test] for [Master Test] institution', () => {
          it('Should get HTTP status 401', async () => {
            const testConfig = {
              masterInstitutionId,
              subInstitutionId,
              token: 'Bearer: random',
              subInstitutionIsValidated: true,
              subInstitutionCreatedByAdmin: true,
              expectedHTTPStatus: 401,
            };
            await testCreateSubInstitution(testConfig);
          });
        });
        afterAll(async () => {
          await deleteInstitutionAsAdmin(subInstitutionId);
        });
      });

      describe('With sub institution created by user', () => {
        beforeAll(async () => {
          subInstitutionId = await createInstitution(subInstitutionTest, userTest);
          await validateInstitutionAsAdmin(subInstitutionId);
        });
        describe('PUT /institutions/<id>/subinstitution/<subid> - Create subinstitution [Sub Test] for [Master Test] institution', () => {
          it('Should get HTTP status 401', async () => {
            const testConfig = {
              masterInstitutionId,
              subInstitutionId,
              token: 'Bearer: random',
              subInstitutionIsValidated: true,
              subInstitutionCreatedByAdmin: false,
              expectedHTTPStatus: 401,
            };
            await testCreateSubInstitution(testConfig);
          });
        });
        afterAll(async () => {
          await deleteInstitutionAsAdmin(subInstitutionId);
        });
      });

      afterAll(async () => {
        await deleteInstitutionAsAdmin(masterInstitutionId);
      });
    });

    describe('With master institution created by user', () => {
      beforeAll(async () => {
        masterInstitutionId = await createInstitution(masterInstitutionTest, userTest);
        await validateInstitutionAsAdmin(masterInstitutionId);
      });
      describe('With sub institution created by admin', () => {
        beforeAll(async () => {
          subInstitutionId = await createInstitutionAsAdmin(subInstitutionTest);
          await validateInstitutionAsAdmin(subInstitutionId);
        });
        describe('PUT /institutions/<id>/subinstitution/<subid> - Create subinstitution [Sub Test] for [Master Test] institution', () => {
          it('Should get HTTP status 401', async () => {
            const testConfig = {
              masterInstitutionId,
              subInstitutionId,
              token: 'Bearer: random',
              subInstitutionIsValidated: true,
              subInstitutionCreatedByAdmin: true,
              expectedHTTPStatus: 401,
            };
            await testCreateSubInstitution(testConfig);
          });
        });
        afterAll(async () => {
          await deleteInstitutionAsAdmin(subInstitutionId);
        });
      });

      describe('With sub institution created by user', () => {
        beforeAll(async () => {
          subInstitutionId = await createInstitution(subInstitutionTest, userTest);
          await validateInstitutionAsAdmin(subInstitutionId);
        });
        describe('PUT /institutions/<id>/subinstitution/<subid> - Create subinstitution [Sub Test] for [Master Test] institution', () => {
          it('Should get HTTP status 401', async () => {
            const testConfig = {
              masterInstitutionId,
              subInstitutionId,
              token: 'Bearer: random',
              subInstitutionIsValidated: true,
              subInstitutionCreatedByAdmin: false,
              expectedHTTPStatus: 401,
            };
            await testCreateSubInstitution(testConfig);
          });
        });
        afterAll(async () => {
          await deleteInstitutionAsAdmin(subInstitutionId);
        });
      });

      describe('With sub institution created by another user', () => {
        beforeAll(async () => {
          subInstitutionId = await createInstitution(subInstitutionTest, anotherUserTest);
          await validateInstitutionAsAdmin(subInstitutionId);
        });
        describe('PUT /institutions/<id>/subinstitution/<subid> - Create subinstitution [Sub Test] for [Master Test] institution', () => {
          it('Should get HTTP status 401', async () => {
            const testConfig = {
              masterInstitutionId,
              subInstitutionId,
              token: 'Bearer: random',
              subInstitutionIsValidated: true,
              subInstitutionCreatedByAdmin: false,
              expectedHTTPStatus: 401,
            };
            await testCreateSubInstitution(testConfig);
          });
        });
        afterAll(async () => {
          await deleteInstitutionAsAdmin(subInstitutionId);
        });
      });

      afterAll(async () => {
        await deleteInstitutionAsAdmin(masterInstitutionId);
      });
    });

    describe('With master institution created by another user', () => {
      beforeAll(async () => {
        masterInstitutionId = await createInstitution(masterInstitutionTest, anotherUserTest);
        await validateInstitutionAsAdmin(masterInstitutionId);
      });

      describe('With sub institution created by admin', () => {
        beforeAll(async () => {
          subInstitutionId = await createInstitutionAsAdmin(subInstitutionTest);
          await validateInstitutionAsAdmin(subInstitutionId);
        });
        describe('PUT /institutions/<id>/subinstitution/<subid> - Create subinstitution [Sub Test] for [Master Test] institution', () => {
          it('Should get HTTP status 401', async () => {
            const testConfig = {
              masterInstitutionId,
              subInstitutionId,
              token: 'Bearer: random',
              subInstitutionIsValidated: true,
              subInstitutionCreatedByAdmin: true,
              expectedHTTPStatus: 401,
            };
            await testCreateSubInstitution(testConfig);
          });
        });
        afterAll(async () => {
          await deleteInstitutionAsAdmin(subInstitutionId);
        });
      });

      describe('With sub institution created by user', () => {
        beforeAll(async () => {
          subInstitutionId = await createInstitution(subInstitutionTest, userTest);
          await validateInstitutionAsAdmin(subInstitutionId);
        });

        describe('PUT /institutions/<id>/subinstitution/<subid> - Create subinstitution [Sub Test] for [Master Test] institution', () => {
          it('Should get HTTP status 401', async () => {
            const testConfig = {
              masterInstitutionId,
              subInstitutionId,
              token: 'Bearer: random',
              subInstitutionIsValidated: true,
              subInstitutionCreatedByAdmin: false,
              expectedHTTPStatus: 401,
            };
            await testCreateSubInstitution(testConfig);
          });
        });
        afterAll(async () => {
          await deleteInstitutionAsAdmin(subInstitutionId);
        });
      });

      describe('With sub institution created by another user', () => {
        beforeAll(async () => {
          subInstitutionId = await createInstitution(subInstitutionTest, anotherUserTest);
          await validateInstitutionAsAdmin(subInstitutionId);
        });
        describe('PUT /institutions/<id>/subinstitution/<subid> - Create subinstitution [Sub Test] for [Master Test] institution', () => {
          it('Should get HTTP status 401', async () => {
            const testConfig = {
              masterInstitutionId,
              subInstitutionId,
              token: 'Bearer: random',
              subInstitutionIsValidated: true,
              subInstitutionCreatedByAdmin: false,
              expectedHTTPStatus: 401,
            };
            await testCreateSubInstitution(testConfig);
          });
        });
        afterAll(async () => {
          await deleteInstitutionAsAdmin(subInstitutionId);
        });
      });

      afterAll(async () => {
        await deleteInstitutionAsAdmin(masterInstitutionId);
      });
    });
  });
  afterAll(async () => {
    await deleteUserAsAdmin(userTest.username);
    await deleteUserAsAdmin(anotherUserTest.username);
  });
});

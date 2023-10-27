/* eslint-disable max-len */

const {
  createInstitution,
  createInstitutionAsAdmin,
  createSubInstitution,
  validateInstitutionAsAdmin,
  deleteInstitutionAsAdmin,
} = require('../../../setup/institutions');
const { createUserAsAdmin, activateUser, deleteUserAsAdmin } = require('../../../setup/users');
const { getToken, getAdminToken } = require('../../../setup/login');

const { testDeleteSubInstitution, testGetSubInstitution } = require('./utils');

describe('[institutions - subinstitution]: Test delete features', () => {
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
      });
      describe('Unvalidated master institution', () => {
        describe('With sub institution created by admin', () => {
          beforeAll(async () => {
            subInstitutionId = await createInstitutionAsAdmin(subInstitutionTest);
          });
          describe('Unvalidated sub institution', () => {
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should delete subinstitution', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: true,
                  expectedHTTPStatus: 200,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get empty array of sub institutions', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: true,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          describe('Validated sub institution', () => {
            beforeAll(async () => {
              await validateInstitutionAsAdmin(subInstitutionId);
            });
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should delete subinstitution', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: true,
                  expectedHTTPStatus: 200,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get empty array of sub instutions', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: true,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          afterAll(async () => {
            await deleteInstitutionAsAdmin(subInstitutionId);
          });
        });

        describe('With sub institution created by user', () => {
          beforeAll(async () => {
            subInstitutionId = await createInstitution(subInstitutionTest, userTest);
          });
          describe('Unvalidated sub institution', () => {
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should delete subinstitution', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 200,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get empty array of sub institutions', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          describe('Validated sub institution', () => {
            beforeAll(async () => {
              await validateInstitutionAsAdmin(subInstitutionId);
            });
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should delete subinstitution', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 200,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get empty array of sub institutions', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          afterAll(async () => {
            await deleteInstitutionAsAdmin(subInstitutionId);
          });
        });
      });

      describe('Validated master institution', () => {
        beforeAll(async () => {
          await validateInstitutionAsAdmin(masterInstitutionId);
        });
        describe('With sub institution created by admin', () => {
          beforeAll(async () => {
            subInstitutionId = await createInstitutionAsAdmin(subInstitutionTest);
          });
          describe('Unvalidated sub institution', () => {
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should delete subinstitution', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: true,
                  expectedHTTPStatus: 200,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get empty array of sub institutions', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: true,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          describe('Validated sub institution', () => {
            beforeAll(async () => {
              await validateInstitutionAsAdmin(subInstitutionId);
            });
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should delete subinstitution', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: true,
                  expectedHTTPStatus: 200,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get empty array of sub instutions', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: true,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          afterAll(async () => {
            await deleteInstitutionAsAdmin(subInstitutionId);
          });
        });

        describe('With sub institution created by user', () => {
          beforeAll(async () => {
            subInstitutionId = await createInstitution(subInstitutionTest, userTest);
          });
          describe('Unvalidated sub institution', () => {
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should delete subinstitution', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 200,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get empty array of sub institutions', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          describe('Validated sub institution', () => {
            beforeAll(async () => {
              await validateInstitutionAsAdmin(subInstitutionId);
            });
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should delete subinstitution', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 200,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get empty array of sub institutions', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          afterAll(async () => {
            await deleteInstitutionAsAdmin(subInstitutionId);
          });
        });
      });

      afterAll(async () => {
        await deleteInstitutionAsAdmin(masterInstitutionId);
      });
    });

    describe('With master institution created by user', () => {
      beforeAll(async () => {
        masterInstitutionId = await createInstitution(masterInstitutionTest, userTest);
      });
      describe('Unvalidated master institution', () => {
        describe('With sub institution created by admin', () => {
          beforeAll(async () => {
            subInstitutionId = await createInstitutionAsAdmin(subInstitutionTest);
          });
          describe('Unvalidated sub institution', () => {
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should delete subinstitution', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: true,
                  expectedHTTPStatus: 200,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get empty array of sub institutions', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: true,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          describe('Validated sub institution', () => {
            beforeAll(async () => {
              await validateInstitutionAsAdmin(subInstitutionId);
            });
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should delete subinstitution', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: true,
                  expectedHTTPStatus: 200,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get empty array of sub instutions', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: true,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          afterAll(async () => {
            await deleteInstitutionAsAdmin(subInstitutionId);
          });
        });

        describe('With sub institution created by user', () => {
          beforeAll(async () => {
            subInstitutionId = await createInstitution(subInstitutionTest, userTest);
          });
          describe('Unvalidated sub institution', () => {
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should delete subinstitution', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 200,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get empty array of sub institutions', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          describe('Validated sub institution', () => {
            beforeAll(async () => {
              await validateInstitutionAsAdmin(subInstitutionId);
            });
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should delete subinstitution', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 200,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get empty array of sub institutions', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          afterAll(async () => {
            await deleteInstitutionAsAdmin(subInstitutionId);
          });
        });

        describe('With sub institution created by another user', () => {
          beforeAll(async () => {
            subInstitutionId = await createInstitution(subInstitutionTest, anotherUserTest);
          });
          describe('Unvalidated sub institution', () => {
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should delete subinstitution', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 200,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get empty array of sub institutions', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          describe('Validated sub institution', () => {
            beforeAll(async () => {
              await validateInstitutionAsAdmin(subInstitutionId);
            });
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should delete subinstitution', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 200,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get empty array of sub institutions', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          afterAll(async () => {
            await deleteInstitutionAsAdmin(subInstitutionId);
          });
        });
      });

      describe('Validated master institution', () => {
        beforeAll(async () => {
          await validateInstitutionAsAdmin(masterInstitutionId);
        });
        describe('With sub institution created by admin', () => {
          beforeAll(async () => {
            subInstitutionId = await createInstitutionAsAdmin(subInstitutionTest);
          });
          describe('Unvalidated sub institution', () => {
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should delete subinstitution', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: true,
                  expectedHTTPStatus: 200,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get empty array of sub institutions', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: true,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          describe('Validated sub institution', () => {
            beforeAll(async () => {
              await validateInstitutionAsAdmin(subInstitutionId);
            });
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should delete subinstitution', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: true,
                  expectedHTTPStatus: 200,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get empty array of sub instutions', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: true,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          afterAll(async () => {
            await deleteInstitutionAsAdmin(subInstitutionId);
          });
        });

        describe('With sub institution created by user', () => {
          beforeAll(async () => {
            subInstitutionId = await createInstitution(subInstitutionTest, userTest);
          });
          describe('Unvalidated sub institution', () => {
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should delete subinstitution', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 200,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get empty array of sub institutions', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          describe('Validated sub institution', () => {
            beforeAll(async () => {
              await validateInstitutionAsAdmin(subInstitutionId);
            });
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should delete subinstitution', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 200,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get empty array of sub institutions', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          afterAll(async () => {
            await deleteInstitutionAsAdmin(subInstitutionId);
          });
        });

        describe('With sub institution created by another user', () => {
          beforeAll(async () => {
            subInstitutionId = await createInstitution(subInstitutionTest, anotherUserTest);
          });
          describe('Unvalidated sub institution', () => {
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should delete subinstitution', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 200,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get empty array of sub institutions', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          describe('Validated sub institution', () => {
            beforeAll(async () => {
              await validateInstitutionAsAdmin(subInstitutionId);
            });
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should delete subinstitution', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 200,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get empty array of sub institutions', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          afterAll(async () => {
            await deleteInstitutionAsAdmin(subInstitutionId);
          });
        });
      });

      afterAll(async () => {
        await deleteInstitutionAsAdmin(masterInstitutionId);
      });
    });

    describe('With master institution created by another user', () => {
      beforeAll(async () => {
        masterInstitutionId = await createInstitution(masterInstitutionTest, anotherUserTest);
      });
      describe('Unvalidated master institution', () => {
        describe('With sub institution created by admin', () => {
          beforeAll(async () => {
            subInstitutionId = await createInstitutionAsAdmin(subInstitutionTest);
          });
          describe('Unvalidated sub institution', () => {
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should delete subinstitution', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: true,
                  expectedHTTPStatus: 200,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get empty array of sub institutions', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: true,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          describe('Validated sub institution', () => {
            beforeAll(async () => {
              await validateInstitutionAsAdmin(subInstitutionId);
            });
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should delete subinstitution', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: true,
                  expectedHTTPStatus: 200,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get empty array of sub instutions', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: true,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          afterAll(async () => {
            await deleteInstitutionAsAdmin(subInstitutionId);
          });
        });

        describe('With sub institution created by user', () => {
          beforeAll(async () => {
            subInstitutionId = await createInstitution(subInstitutionTest, userTest);
          });
          describe('Unvalidated sub institution', () => {
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should delete subinstitution', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 200,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get empty array of sub institutions', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          describe('Validated sub institution', () => {
            beforeAll(async () => {
              await validateInstitutionAsAdmin(subInstitutionId);
            });
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should delete subinstitution', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 200,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get empty array of sub institutions', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          afterAll(async () => {
            await deleteInstitutionAsAdmin(subInstitutionId);
          });
        });

        describe('With sub institution created by another user', () => {
          beforeAll(async () => {
            subInstitutionId = await createInstitution(subInstitutionTest, anotherUserTest);
          });
          describe('Unvalidated sub institution', () => {
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should delete subinstitution', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 200,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get empty array of sub institutions', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          describe('Validated sub institution', () => {
            beforeAll(async () => {
              await validateInstitutionAsAdmin(subInstitutionId);
            });
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should delete subinstitution', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 200,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get empty array of sub institutions', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          afterAll(async () => {
            await deleteInstitutionAsAdmin(subInstitutionId);
          });
        });
      });

      describe('Validated master institution', () => {
        beforeAll(async () => {
          await validateInstitutionAsAdmin(masterInstitutionId);
        });
        describe('With sub institution created by admin', () => {
          beforeAll(async () => {
            subInstitutionId = await createInstitutionAsAdmin(subInstitutionTest);
          });
          describe('Unvalidated sub institution', () => {
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should delete subinstitution', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: true,
                  expectedHTTPStatus: 200,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get empty array of sub institutions', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: true,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          describe('Validated sub institution', () => {
            beforeAll(async () => {
              await validateInstitutionAsAdmin(subInstitutionId);
            });
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should delete subinstitution', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: true,
                  expectedHTTPStatus: 200,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get empty array of sub instutions', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: true,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          afterAll(async () => {
            await deleteInstitutionAsAdmin(subInstitutionId);
          });
        });

        describe('With sub institution created by user', () => {
          beforeAll(async () => {
            subInstitutionId = await createInstitution(subInstitutionTest, userTest);
          });
          describe('Unvalidated sub institution', () => {
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should delete subinstitution', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 200,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get empty array of sub institutions', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          describe('Validated sub institution', () => {
            beforeAll(async () => {
              await validateInstitutionAsAdmin(subInstitutionId);
            });
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should delete subinstitution', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 200,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get empty array of sub institutions', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          afterAll(async () => {
            await deleteInstitutionAsAdmin(subInstitutionId);
          });
        });

        describe('With sub institution created by another user', () => {
          beforeAll(async () => {
            subInstitutionId = await createInstitution(subInstitutionTest, anotherUserTest);
          });
          describe('Unvalidated sub institution', () => {
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should delete subinstitution', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 200,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get empty array of sub institutions', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          describe('Validated sub institution', () => {
            beforeAll(async () => {
              await validateInstitutionAsAdmin(subInstitutionId);
            });
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should delete subinstitution', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 200,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get empty array of sub institutions', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          afterAll(async () => {
            await deleteInstitutionAsAdmin(subInstitutionId);
          });
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
      });
      describe('Unvalidated master institution', () => {
        describe('With sub institution created by admin', () => {
          beforeAll(async () => {
            subInstitutionId = await createInstitutionAsAdmin(subInstitutionTest);
          });
          describe('Unvalidated sub institution', () => {
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should get HTTP status 403', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: userToken,
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: true,
                  expectedHTTPStatus: 403,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get sub institution', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: true,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          describe('Validated sub institution', () => {
            beforeAll(async () => {
              await validateInstitutionAsAdmin(subInstitutionId);
            });
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should get HTTP status 403', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: userToken,
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: true,
                  expectedHTTPStatus: 403,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get sub institution', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: true,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          afterAll(async () => {
            await deleteInstitutionAsAdmin(subInstitutionId);
          });
        });

        describe('With sub institution created by user', () => {
          beforeAll(async () => {
            subInstitutionId = await createInstitution(subInstitutionTest, userTest);
          });
          describe('Unvalidated sub institution', () => {
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should get HTTP status 403', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: userToken,
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 403,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get sub institution', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          describe('Validated sub institution', () => {
            beforeAll(async () => {
              await validateInstitutionAsAdmin(subInstitutionId);
            });
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should get HTTP status 403', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: userToken,
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 403,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get sub institution', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          afterAll(async () => {
            await deleteInstitutionAsAdmin(subInstitutionId);
          });
        });
      });

      describe('Validated master institution', () => {
        beforeAll(async () => {
          await validateInstitutionAsAdmin(masterInstitutionId);
        });
        describe('With sub institution created by admin', () => {
          beforeAll(async () => {
            subInstitutionId = await createInstitutionAsAdmin(subInstitutionTest);
          });
          describe('Unvalidated sub institution', () => {
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should get HTTP status 403', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: userToken,
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: true,
                  expectedHTTPStatus: 403,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get sub institution', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: true,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          describe('Validated sub institution', () => {
            beforeAll(async () => {
              await validateInstitutionAsAdmin(subInstitutionId);
            });
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should get HTTP status 403', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: userToken,
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: true,
                  expectedHTTPStatus: 403,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get sub institution', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: true,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          afterAll(async () => {
            await deleteInstitutionAsAdmin(subInstitutionId);
          });
        });

        describe('With sub institution created by user', () => {
          beforeAll(async () => {
            subInstitutionId = await createInstitution(subInstitutionTest, userTest);
          });
          describe('Unvalidated sub institution', () => {
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should get HTTP status 403', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: userToken,
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 403,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get sub institution', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          describe('Validated sub institution', () => {
            beforeAll(async () => {
              await validateInstitutionAsAdmin(subInstitutionId);
            });
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should get HTTP status 403', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: userToken,
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 403,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get sub institution', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          afterAll(async () => {
            await deleteInstitutionAsAdmin(subInstitutionId);
          });
        });
      });

      afterAll(async () => {
        await deleteInstitutionAsAdmin(masterInstitutionId);
      });
    });

    describe('With master institution created by user', () => {
      beforeAll(async () => {
        masterInstitutionId = await createInstitution(masterInstitutionTest, userTest);
      });
      describe('Unvalidated master institution', () => {
        describe('With sub institution created by admin', () => {
          beforeAll(async () => {
            subInstitutionId = await createInstitutionAsAdmin(subInstitutionTest);
          });
          describe('Unvalidated sub institution', () => {
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should get HTTP status 403', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: userToken,
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: true,
                  expectedHTTPStatus: 403,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get sub institution', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: true,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          describe('Validated sub institution', () => {
            beforeAll(async () => {
              await validateInstitutionAsAdmin(subInstitutionId);
            });
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should get HTTP status 403', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: userToken,
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: true,
                  expectedHTTPStatus: 403,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get sub institution', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: true,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          afterAll(async () => {
            await deleteInstitutionAsAdmin(subInstitutionId);
          });
        });

        describe('With sub institution created by user', () => {
          beforeAll(async () => {
            subInstitutionId = await createInstitution(subInstitutionTest, userTest);
          });
          describe('Unvalidated sub institution', () => {
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should get HTTP status 403', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: userToken,
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 403,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get sub institution', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          describe('Validated sub institution', () => {
            beforeAll(async () => {
              await validateInstitutionAsAdmin(subInstitutionId);
            });
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should get HTTP status 403', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: userToken,
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 403,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get sub institution', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          afterAll(async () => {
            await deleteInstitutionAsAdmin(subInstitutionId);
          });
        });

        describe('With sub institution created by another user', () => {
          beforeAll(async () => {
            subInstitutionId = await createInstitution(subInstitutionTest, anotherUserTest);
          });
          describe('Unvalidated sub institution', () => {
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should get HTTP status 403', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: userToken,
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 403,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get sub institution', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          describe('Validated sub institution', () => {
            beforeAll(async () => {
              await validateInstitutionAsAdmin(subInstitutionId);
            });
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should get HTTP status 403', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: userToken,
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 403,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get sub institution', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          afterAll(async () => {
            await deleteInstitutionAsAdmin(subInstitutionId);
          });
        });
      });

      describe('Validated master institution', () => {
        beforeAll(async () => {
          await validateInstitutionAsAdmin(masterInstitutionId);
        });
        describe('With sub institution created by admin', () => {
          beforeAll(async () => {
            subInstitutionId = await createInstitutionAsAdmin(subInstitutionTest);
          });
          describe('Unvalidated sub institution', () => {
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should get HTTP status 403', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: userToken,
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: true,
                  expectedHTTPStatus: 403,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get sub institution', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: true,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          describe('Validated sub institution', () => {
            beforeAll(async () => {
              await validateInstitutionAsAdmin(subInstitutionId);
            });
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should get HTTP status 403', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: userToken,
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: true,
                  expectedHTTPStatus: 403,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get sub institution', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: true,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          afterAll(async () => {
            await deleteInstitutionAsAdmin(subInstitutionId);
          });
        });

        describe('With sub institution created by user', () => {
          beforeAll(async () => {
            subInstitutionId = await createInstitution(subInstitutionTest, userTest);
          });
          describe('Unvalidated sub institution', () => {
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should get HTTP status 403', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: userToken,
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 403,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get sub institution', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          describe('Validated sub institution', () => {
            beforeAll(async () => {
              await validateInstitutionAsAdmin(subInstitutionId);
            });
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should get HTTP status 403', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: userToken,
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 403,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get sub institution', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          afterAll(async () => {
            await deleteInstitutionAsAdmin(subInstitutionId);
          });
        });

        describe('With sub institution created by another user', () => {
          beforeAll(async () => {
            subInstitutionId = await createInstitution(subInstitutionTest, anotherUserTest);
          });
          describe('Unvalidated sub institution', () => {
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should get HTTP status 403', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: userToken,
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 403,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get sub institution', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          describe('Validated sub institution', () => {
            beforeAll(async () => {
              await validateInstitutionAsAdmin(subInstitutionId);
            });
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should get HTTP status 403', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: userToken,
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 403,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get sub institution', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          afterAll(async () => {
            await deleteInstitutionAsAdmin(subInstitutionId);
          });
        });
      });

      afterAll(async () => {
        await deleteInstitutionAsAdmin(masterInstitutionId);
      });
    });

    describe('With master institution created by another user', () => {
      beforeAll(async () => {
        masterInstitutionId = await createInstitution(masterInstitutionTest, anotherUserTest);
      });
      describe('Unvalidated master institution', () => {
        describe('With sub institution created by admin', () => {
          beforeAll(async () => {
            subInstitutionId = await createInstitutionAsAdmin(subInstitutionTest);
          });
          describe('Unvalidated sub institution', () => {
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should get HTTP status 403', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: userToken,
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: true,
                  expectedHTTPStatus: 403,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get sub institution', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: true,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          describe('Validated sub institution', () => {
            beforeAll(async () => {
              await validateInstitutionAsAdmin(subInstitutionId);
            });
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should get HTTP status 403', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: userToken,
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: true,
                  expectedHTTPStatus: 403,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get sub institution', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: true,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          afterAll(async () => {
            await deleteInstitutionAsAdmin(subInstitutionId);
          });
        });

        describe('With sub institution created by user', () => {
          beforeAll(async () => {
            subInstitutionId = await createInstitution(subInstitutionTest, userTest);
          });
          describe('Unvalidated sub institution', () => {
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should get HTTP status 403', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: userToken,
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 403,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get sub institution', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          describe('Validated sub institution', () => {
            beforeAll(async () => {
              await validateInstitutionAsAdmin(subInstitutionId);
            });
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should get HTTP status 403', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: userToken,
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 403,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get sub institution', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          afterAll(async () => {
            await deleteInstitutionAsAdmin(subInstitutionId);
          });
        });

        describe('With sub institution created by another user', () => {
          beforeAll(async () => {
            subInstitutionId = await createInstitution(subInstitutionTest, anotherUserTest);
          });
          describe('Unvalidated sub institution', () => {
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should get HTTP status 403', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: userToken,
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 403,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get sub institution', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          describe('Validated sub institution', () => {
            beforeAll(async () => {
              await validateInstitutionAsAdmin(subInstitutionId);
            });
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should get HTTP status 403', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: userToken,
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 403,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get sub institution', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          afterAll(async () => {
            await deleteInstitutionAsAdmin(subInstitutionId);
          });
        });
      });

      describe('Validated master institution', () => {
        beforeAll(async () => {
          await validateInstitutionAsAdmin(masterInstitutionId);
        });
        describe('With sub institution created by admin', () => {
          beforeAll(async () => {
            subInstitutionId = await createInstitutionAsAdmin(subInstitutionTest);
          });
          describe('Unvalidated sub institution', () => {
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should get HTTP status 403', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: userToken,
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: true,
                  expectedHTTPStatus: 403,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get sub institution', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: true,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          describe('Validated sub institution', () => {
            beforeAll(async () => {
              await validateInstitutionAsAdmin(subInstitutionId);
            });
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should get HTTP status 403', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: userToken,
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: true,
                  expectedHTTPStatus: 403,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get sub institution', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: true,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          afterAll(async () => {
            await deleteInstitutionAsAdmin(subInstitutionId);
          });
        });

        describe('With sub institution created by user', () => {
          beforeAll(async () => {
            subInstitutionId = await createInstitution(subInstitutionTest, userTest);
          });
          describe('Unvalidated sub institution', () => {
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should get HTTP status 403', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: userToken,
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 403,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get sub institution', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          describe('Validated sub institution', () => {
            beforeAll(async () => {
              await validateInstitutionAsAdmin(subInstitutionId);
            });
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should get HTTP status 403', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: userToken,
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 403,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get sub institution', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          afterAll(async () => {
            await deleteInstitutionAsAdmin(subInstitutionId);
          });
        });

        describe('With sub institution created by another user', () => {
          beforeAll(async () => {
            subInstitutionId = await createInstitution(subInstitutionTest, anotherUserTest);
          });
          describe('Unvalidated sub institution', () => {
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should get HTTP status 403', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: userToken,
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 403,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get sub institution', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          describe('Validated sub institution', () => {
            beforeAll(async () => {
              await validateInstitutionAsAdmin(subInstitutionId);
            });
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should get HTTP status 403', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: userToken,
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 403,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get sub institution', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          afterAll(async () => {
            await deleteInstitutionAsAdmin(subInstitutionId);
          });
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
      });
      describe('Unvalidated master institution', () => {
        describe('With sub institution created by admin', () => {
          beforeAll(async () => {
            subInstitutionId = await createInstitutionAsAdmin(subInstitutionTest);
          });
          describe('Unvalidated sub institution', () => {
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should get HTTP status 401', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: undefined,
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: true,
                  expectedHTTPStatus: 401,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get sub institution', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: true,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          describe('Validated sub institution', () => {
            beforeAll(async () => {
              await validateInstitutionAsAdmin(subInstitutionId);
            });
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should get HTTP status 401', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: undefined,
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: true,
                  expectedHTTPStatus: 401,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get sub institution', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: true,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          afterAll(async () => {
            await deleteInstitutionAsAdmin(subInstitutionId);
          });
        });

        describe('With sub institution created by user', () => {
          beforeAll(async () => {
            subInstitutionId = await createInstitution(subInstitutionTest, userTest);
          });
          describe('Unvalidated sub institution', () => {
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should get HTTP status 401', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: undefined,
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 401,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get sub institution', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          describe('Validated sub institution', () => {
            beforeAll(async () => {
              await validateInstitutionAsAdmin(subInstitutionId);
            });
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should get HTTP status 401', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: undefined,
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 401,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get sub institution', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          afterAll(async () => {
            await deleteInstitutionAsAdmin(subInstitutionId);
          });
        });
      });

      describe('Validated master institution', () => {
        beforeAll(async () => {
          await validateInstitutionAsAdmin(masterInstitutionId);
        });
        describe('With sub institution created by admin', () => {
          beforeAll(async () => {
            subInstitutionId = await createInstitutionAsAdmin(subInstitutionTest);
          });
          describe('Unvalidated sub institution', () => {
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should get HTTP status 401', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: undefined,
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: true,
                  expectedHTTPStatus: 401,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get sub institution', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: true,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          describe('Validated sub institution', () => {
            beforeAll(async () => {
              await validateInstitutionAsAdmin(subInstitutionId);
            });
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should get HTTP status 401', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: undefined,
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: true,
                  expectedHTTPStatus: 401,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get sub institution', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: true,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          afterAll(async () => {
            await deleteInstitutionAsAdmin(subInstitutionId);
          });
        });

        describe('With sub institution created by user', () => {
          beforeAll(async () => {
            subInstitutionId = await createInstitution(subInstitutionTest, userTest);
          });
          describe('Unvalidated sub institution', () => {
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should get HTTP status 401', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: undefined,
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 401,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get sub institution', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          describe('Validated sub institution', () => {
            beforeAll(async () => {
              await validateInstitutionAsAdmin(subInstitutionId);
            });
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should get HTTP status 401', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: undefined,
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 401,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get sub institution', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          afterAll(async () => {
            await deleteInstitutionAsAdmin(subInstitutionId);
          });
        });
      });

      afterAll(async () => {
        await deleteInstitutionAsAdmin(masterInstitutionId);
      });
    });

    describe('With master institution created by user', () => {
      beforeAll(async () => {
        masterInstitutionId = await createInstitution(masterInstitutionTest, userTest);
      });
      describe('Unvalidated master institution', () => {
        describe('With sub institution created by admin', () => {
          beforeAll(async () => {
            subInstitutionId = await createInstitutionAsAdmin(subInstitutionTest);
          });
          describe('Unvalidated sub institution', () => {
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should get HTTP status 401', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: undefined,
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: true,
                  expectedHTTPStatus: 401,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get sub institution', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: true,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          describe('Validated sub institution', () => {
            beforeAll(async () => {
              await validateInstitutionAsAdmin(subInstitutionId);
            });
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should get HTTP status 401', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: undefined,
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: true,
                  expectedHTTPStatus: 401,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get sub institution', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: true,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          afterAll(async () => {
            await deleteInstitutionAsAdmin(subInstitutionId);
          });
        });

        describe('With sub institution created by user', () => {
          beforeAll(async () => {
            subInstitutionId = await createInstitution(subInstitutionTest, userTest);
          });
          describe('Unvalidated sub institution', () => {
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should get HTTP status 401', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: undefined,
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 401,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get sub institution', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          describe('Validated sub institution', () => {
            beforeAll(async () => {
              await validateInstitutionAsAdmin(subInstitutionId);
            });
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should get HTTP status 401', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: undefined,
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 401,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get sub institution', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          afterAll(async () => {
            await deleteInstitutionAsAdmin(subInstitutionId);
          });
        });

        describe('With sub institution created by another user', () => {
          beforeAll(async () => {
            subInstitutionId = await createInstitution(subInstitutionTest, anotherUserTest);
          });
          describe('Unvalidated sub institution', () => {
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should get HTTP status 401', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: undefined,
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 401,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get sub institution', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          describe('Validated sub institution', () => {
            beforeAll(async () => {
              await validateInstitutionAsAdmin(subInstitutionId);
            });
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should get HTTP status 401', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: undefined,
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 401,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get sub institution', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          afterAll(async () => {
            await deleteInstitutionAsAdmin(subInstitutionId);
          });
        });
      });

      describe('Validated master institution', () => {
        beforeAll(async () => {
          await validateInstitutionAsAdmin(masterInstitutionId);
        });
        describe('With sub institution created by admin', () => {
          beforeAll(async () => {
            subInstitutionId = await createInstitutionAsAdmin(subInstitutionTest);
          });
          describe('Unvalidated sub institution', () => {
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should get HTTP status 401', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: undefined,
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: true,
                  expectedHTTPStatus: 401,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get sub institution', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: true,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          describe('Validated sub institution', () => {
            beforeAll(async () => {
              await validateInstitutionAsAdmin(subInstitutionId);
            });
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should get HTTP status 401', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: undefined,
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: true,
                  expectedHTTPStatus: 401,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get sub institution', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: true,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          afterAll(async () => {
            await deleteInstitutionAsAdmin(subInstitutionId);
          });
        });

        describe('With sub institution created by user', () => {
          beforeAll(async () => {
            subInstitutionId = await createInstitution(subInstitutionTest, userTest);
          });
          describe('Unvalidated sub institution', () => {
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should get HTTP status 401', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: undefined,
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 401,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get sub institution', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          describe('Validated sub institution', () => {
            beforeAll(async () => {
              await validateInstitutionAsAdmin(subInstitutionId);
            });
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should get HTTP status 401', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: undefined,
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 401,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get sub institution', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          afterAll(async () => {
            await deleteInstitutionAsAdmin(subInstitutionId);
          });
        });

        describe('With sub institution created by another user', () => {
          beforeAll(async () => {
            subInstitutionId = await createInstitution(subInstitutionTest, anotherUserTest);
          });
          describe('Unvalidated sub institution', () => {
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should get HTTP status 401', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: undefined,
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 401,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get sub institution', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          describe('Validated sub institution', () => {
            beforeAll(async () => {
              await validateInstitutionAsAdmin(subInstitutionId);
            });
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should get HTTP status 401', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: undefined,
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 401,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get sub institution', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          afterAll(async () => {
            await deleteInstitutionAsAdmin(subInstitutionId);
          });
        });
      });

      afterAll(async () => {
        await deleteInstitutionAsAdmin(masterInstitutionId);
      });
    });

    describe('With master institution created by another user', () => {
      beforeAll(async () => {
        masterInstitutionId = await createInstitution(masterInstitutionTest, anotherUserTest);
      });
      describe('Unvalidated master institution', () => {
        describe('With sub institution created by admin', () => {
          beforeAll(async () => {
            subInstitutionId = await createInstitutionAsAdmin(subInstitutionTest);
          });
          describe('Unvalidated sub institution', () => {
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should get HTTP status 401', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: undefined,
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: true,
                  expectedHTTPStatus: 401,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get sub institution', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: true,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          describe('Validated sub institution', () => {
            beforeAll(async () => {
              await validateInstitutionAsAdmin(subInstitutionId);
            });
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should get HTTP status 401', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: undefined,
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: true,
                  expectedHTTPStatus: 401,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get sub institution', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: true,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          afterAll(async () => {
            await deleteInstitutionAsAdmin(subInstitutionId);
          });
        });

        describe('With sub institution created by user', () => {
          beforeAll(async () => {
            subInstitutionId = await createInstitution(subInstitutionTest, userTest);
          });
          describe('Unvalidated sub institution', () => {
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should get HTTP status 401', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: undefined,
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 401,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get sub institution', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          describe('Validated sub institution', () => {
            beforeAll(async () => {
              await validateInstitutionAsAdmin(subInstitutionId);
            });
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should get HTTP status 401', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: undefined,
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 401,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get sub institution', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          afterAll(async () => {
            await deleteInstitutionAsAdmin(subInstitutionId);
          });
        });

        describe('With sub institution created by another user', () => {
          beforeAll(async () => {
            subInstitutionId = await createInstitution(subInstitutionTest, anotherUserTest);
          });
          describe('Unvalidated sub institution', () => {
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should get HTTP status 401', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: undefined,
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 401,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get sub institution', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          describe('Validated sub institution', () => {
            beforeAll(async () => {
              await validateInstitutionAsAdmin(subInstitutionId);
            });
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should get HTTP status 401', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: undefined,
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 401,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get sub institution', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          afterAll(async () => {
            await deleteInstitutionAsAdmin(subInstitutionId);
          });
        });
      });

      describe('Validated master institution', () => {
        beforeAll(async () => {
          await validateInstitutionAsAdmin(masterInstitutionId);
        });
        describe('With sub institution created by admin', () => {
          beforeAll(async () => {
            subInstitutionId = await createInstitutionAsAdmin(subInstitutionTest);
          });
          describe('Unvalidated sub institution', () => {
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should get HTTP status 401', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: undefined,
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: true,
                  expectedHTTPStatus: 401,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get sub institution', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: true,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          describe('Validated sub institution', () => {
            beforeAll(async () => {
              await validateInstitutionAsAdmin(subInstitutionId);
            });
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should get HTTP status 401', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: undefined,
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: true,
                  expectedHTTPStatus: 401,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get sub institution', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: true,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          afterAll(async () => {
            await deleteInstitutionAsAdmin(subInstitutionId);
          });
        });

        describe('With sub institution created by user', () => {
          beforeAll(async () => {
            subInstitutionId = await createInstitution(subInstitutionTest, userTest);
          });
          describe('Unvalidated sub institution', () => {
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should get HTTP status 401', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: undefined,
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 401,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get sub institution', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          describe('Validated sub institution', () => {
            beforeAll(async () => {
              await validateInstitutionAsAdmin(subInstitutionId);
            });
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should get HTTP status 401', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: undefined,
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 401,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get sub institution', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          afterAll(async () => {
            await deleteInstitutionAsAdmin(subInstitutionId);
          });
        });

        describe('With sub institution created by another user', () => {
          beforeAll(async () => {
            subInstitutionId = await createInstitution(subInstitutionTest, anotherUserTest);
          });
          describe('Unvalidated sub institution', () => {
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should get HTTP status 401', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: undefined,
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 401,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get sub institution', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          describe('Validated sub institution', () => {
            beforeAll(async () => {
              await validateInstitutionAsAdmin(subInstitutionId);
            });
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should get HTTP status 401', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: undefined,
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 401,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get sub institution', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          afterAll(async () => {
            await deleteInstitutionAsAdmin(subInstitutionId);
          });
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
      });
      describe('Unvalidated master institution', () => {
        describe('With sub institution created by admin', () => {
          beforeAll(async () => {
            subInstitutionId = await createInstitutionAsAdmin(subInstitutionTest);
          });
          describe('Unvalidated sub institution', () => {
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should get HTTP status 401', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: 'Bearer: random',
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: true,
                  expectedHTTPStatus: 401,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get sub institution', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: true,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          describe('Validated sub institution', () => {
            beforeAll(async () => {
              await validateInstitutionAsAdmin(subInstitutionId);
            });
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should get HTTP status 401', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: 'Bearer: random',
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: true,
                  expectedHTTPStatus: 401,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get sub institution', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: true,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          afterAll(async () => {
            await deleteInstitutionAsAdmin(subInstitutionId);
          });
        });

        describe('With sub institution created by user', () => {
          beforeAll(async () => {
            subInstitutionId = await createInstitution(subInstitutionTest, userTest);
          });
          describe('Unvalidated sub institution', () => {
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should get HTTP status 401', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: 'Bearer: random',
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 401,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get sub institution', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          describe('Validated sub institution', () => {
            beforeAll(async () => {
              await validateInstitutionAsAdmin(subInstitutionId);
            });
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should get HTTP status 401', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: 'Bearer: random',
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 401,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get sub institution', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          afterAll(async () => {
            await deleteInstitutionAsAdmin(subInstitutionId);
          });
        });
      });

      describe('Validated master institution', () => {
        beforeAll(async () => {
          await validateInstitutionAsAdmin(masterInstitutionId);
        });
        describe('With sub institution created by admin', () => {
          beforeAll(async () => {
            subInstitutionId = await createInstitutionAsAdmin(subInstitutionTest);
          });
          describe('Unvalidated sub institution', () => {
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should get HTTP status 401', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: 'Bearer: random',
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: true,
                  expectedHTTPStatus: 401,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get sub institution', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: true,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          describe('Validated sub institution', () => {
            beforeAll(async () => {
              await validateInstitutionAsAdmin(subInstitutionId);
            });
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should get HTTP status 401', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: 'Bearer: random',
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: true,
                  expectedHTTPStatus: 401,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get sub institution', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: true,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          afterAll(async () => {
            await deleteInstitutionAsAdmin(subInstitutionId);
          });
        });

        describe('With sub institution created by user', () => {
          beforeAll(async () => {
            subInstitutionId = await createInstitution(subInstitutionTest, userTest);
          });
          describe('Unvalidated sub institution', () => {
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should get HTTP status 401', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: 'Bearer: random',
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 401,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get sub institution', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          describe('Validated sub institution', () => {
            beforeAll(async () => {
              await validateInstitutionAsAdmin(subInstitutionId);
            });
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should get HTTP status 401', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: 'Bearer: random',
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 401,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get sub institution', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          afterAll(async () => {
            await deleteInstitutionAsAdmin(subInstitutionId);
          });
        });
      });

      afterAll(async () => {
        await deleteInstitutionAsAdmin(masterInstitutionId);
      });
    });

    describe('With master institution created by user', () => {
      beforeAll(async () => {
        masterInstitutionId = await createInstitution(masterInstitutionTest, userTest);
      });
      describe('Unvalidated master institution', () => {
        describe('With sub institution created by admin', () => {
          beforeAll(async () => {
            subInstitutionId = await createInstitutionAsAdmin(subInstitutionTest);
          });
          describe('Unvalidated sub institution', () => {
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should get HTTP status 401', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: 'Bearer: random',
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: true,
                  expectedHTTPStatus: 401,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get sub institution', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: true,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          describe('Validated sub institution', () => {
            beforeAll(async () => {
              await validateInstitutionAsAdmin(subInstitutionId);
            });
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should get HTTP status 401', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: 'Bearer: random',
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: true,
                  expectedHTTPStatus: 401,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get sub institution', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: true,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          afterAll(async () => {
            await deleteInstitutionAsAdmin(subInstitutionId);
          });
        });

        describe('With sub institution created by user', () => {
          beforeAll(async () => {
            subInstitutionId = await createInstitution(subInstitutionTest, userTest);
          });
          describe('Unvalidated sub institution', () => {
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should get HTTP status 401', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: 'Bearer: random',
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 401,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get sub institution', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          describe('Validated sub institution', () => {
            beforeAll(async () => {
              await validateInstitutionAsAdmin(subInstitutionId);
            });
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should get HTTP status 401', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: 'Bearer: random',
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 401,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get sub institution', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          afterAll(async () => {
            await deleteInstitutionAsAdmin(subInstitutionId);
          });
        });

        describe('With sub institution created by another user', () => {
          beforeAll(async () => {
            subInstitutionId = await createInstitution(subInstitutionTest, anotherUserTest);
          });
          describe('Unvalidated sub institution', () => {
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should get HTTP status 401', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: 'Bearer: random',
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 401,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get sub institution', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          describe('Validated sub institution', () => {
            beforeAll(async () => {
              await validateInstitutionAsAdmin(subInstitutionId);
            });
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should get HTTP status 401', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: 'Bearer: random',
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 401,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get sub institution', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          afterAll(async () => {
            await deleteInstitutionAsAdmin(subInstitutionId);
          });
        });
      });

      describe('Validated master institution', () => {
        beforeAll(async () => {
          await validateInstitutionAsAdmin(masterInstitutionId);
        });
        describe('With sub institution created by admin', () => {
          beforeAll(async () => {
            subInstitutionId = await createInstitutionAsAdmin(subInstitutionTest);
          });
          describe('Unvalidated sub institution', () => {
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should get HTTP status 401', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: 'Bearer: random',
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: true,
                  expectedHTTPStatus: 401,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get sub institution', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: true,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          describe('Validated sub institution', () => {
            beforeAll(async () => {
              await validateInstitutionAsAdmin(subInstitutionId);
            });
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should get HTTP status 401', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: 'Bearer: random',
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: true,
                  expectedHTTPStatus: 401,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get sub institution', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: true,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          afterAll(async () => {
            await deleteInstitutionAsAdmin(subInstitutionId);
          });
        });

        describe('With sub institution created by user', () => {
          beforeAll(async () => {
            subInstitutionId = await createInstitution(subInstitutionTest, userTest);
          });
          describe('Unvalidated sub institution', () => {
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should get HTTP status 401', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: 'Bearer: random',
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 401,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get sub institution', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          describe('Validated sub institution', () => {
            beforeAll(async () => {
              await validateInstitutionAsAdmin(subInstitutionId);
            });
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should get HTTP status 401', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: 'Bearer: random',
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 401,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get sub institution', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          afterAll(async () => {
            await deleteInstitutionAsAdmin(subInstitutionId);
          });
        });

        describe('With sub institution created by another user', () => {
          beforeAll(async () => {
            subInstitutionId = await createInstitution(subInstitutionTest, anotherUserTest);
          });
          describe('Unvalidated sub institution', () => {
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should get HTTP status 401', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: 'Bearer: random',
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 401,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get sub institution', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          describe('Validated sub institution', () => {
            beforeAll(async () => {
              await validateInstitutionAsAdmin(subInstitutionId);
            });
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should get HTTP status 401', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: 'Bearer: random',
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 401,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get sub institution', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          afterAll(async () => {
            await deleteInstitutionAsAdmin(subInstitutionId);
          });
        });
      });

      afterAll(async () => {
        await deleteInstitutionAsAdmin(masterInstitutionId);
      });
    });

    describe('With master institution created by another user', () => {
      beforeAll(async () => {
        masterInstitutionId = await createInstitution(masterInstitutionTest, anotherUserTest);
      });
      describe('Unvalidated master institution', () => {
        describe('With sub institution created by admin', () => {
          beforeAll(async () => {
            subInstitutionId = await createInstitutionAsAdmin(subInstitutionTest);
          });
          describe('Unvalidated sub institution', () => {
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should get HTTP status 401', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: 'Bearer: random',
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: true,
                  expectedHTTPStatus: 401,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get sub institution', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: true,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          describe('Validated sub institution', () => {
            beforeAll(async () => {
              await validateInstitutionAsAdmin(subInstitutionId);
            });
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should get HTTP status 401', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: 'Bearer: random',
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: true,
                  expectedHTTPStatus: 401,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get sub institution', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: true,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          afterAll(async () => {
            await deleteInstitutionAsAdmin(subInstitutionId);
          });
        });

        describe('With sub institution created by user', () => {
          beforeAll(async () => {
            subInstitutionId = await createInstitution(subInstitutionTest, userTest);
          });
          describe('Unvalidated sub institution', () => {
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should get HTTP status 401', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: 'Bearer: random',
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 401,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get sub institution', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          describe('Validated sub institution', () => {
            beforeAll(async () => {
              await validateInstitutionAsAdmin(subInstitutionId);
            });
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should get HTTP status 401', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: 'Bearer: random',
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 401,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get sub institution', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          afterAll(async () => {
            await deleteInstitutionAsAdmin(subInstitutionId);
          });
        });

        describe('With sub institution created by another user', () => {
          beforeAll(async () => {
            subInstitutionId = await createInstitution(subInstitutionTest, anotherUserTest);
          });
          describe('Unvalidated sub institution', () => {
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should get HTTP status 401', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: 'Bearer: random',
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 401,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get sub institution', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          describe('Validated sub institution', () => {
            beforeAll(async () => {
              await validateInstitutionAsAdmin(subInstitutionId);
            });
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should get HTTP status 401', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: 'Bearer: random',
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 401,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get sub institution', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          afterAll(async () => {
            await deleteInstitutionAsAdmin(subInstitutionId);
          });
        });
      });

      describe('Validated master institution', () => {
        beforeAll(async () => {
          await validateInstitutionAsAdmin(masterInstitutionId);
        });
        describe('With sub institution created by admin', () => {
          beforeAll(async () => {
            subInstitutionId = await createInstitutionAsAdmin(subInstitutionTest);
          });
          describe('Unvalidated sub institution', () => {
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should get HTTP status 401', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: 'Bearer: random',
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: true,
                  expectedHTTPStatus: 401,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get sub institution', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: true,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          describe('Validated sub institution', () => {
            beforeAll(async () => {
              await validateInstitutionAsAdmin(subInstitutionId);
            });
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should get HTTP status 401', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: 'Bearer: random',
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: true,
                  expectedHTTPStatus: 401,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get sub institution', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: true,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          afterAll(async () => {
            await deleteInstitutionAsAdmin(subInstitutionId);
          });
        });

        describe('With sub institution created by user', () => {
          beforeAll(async () => {
            subInstitutionId = await createInstitution(subInstitutionTest, userTest);
          });
          describe('Unvalidated sub institution', () => {
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should get HTTP status 401', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: 'Bearer: random',
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 401,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get sub institution', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          describe('Validated sub institution', () => {
            beforeAll(async () => {
              await validateInstitutionAsAdmin(subInstitutionId);
            });
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should get HTTP status 401', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: 'Bearer: random',
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 401,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get sub institution', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          afterAll(async () => {
            await deleteInstitutionAsAdmin(subInstitutionId);
          });
        });

        describe('With sub institution created by another user', () => {
          beforeAll(async () => {
            subInstitutionId = await createInstitution(subInstitutionTest, anotherUserTest);
          });
          describe('Unvalidated sub institution', () => {
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should get HTTP status 401', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: 'Bearer: random',
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 401,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get sub institution', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: false,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          describe('Validated sub institution', () => {
            beforeAll(async () => {
              await validateInstitutionAsAdmin(subInstitutionId);
            });
            describe('Delete /institutions/<id>/subinstitution/<subid> - Delete subinstitution [Sub Test] for [Master Test] institution', () => {
              beforeAll(async () => {
                await createSubInstitution(masterInstitutionId, subInstitutionId);
              });
              it('Should get HTTP status 401', async () => {
                const testDeleteConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: 'Bearer: random',
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 401,
                };
                await testDeleteSubInstitution(testDeleteConfig);
              });
              it('Should get sub institution', async () => {
                const testGetConfig = {
                  masterInstitutionId,
                  subInstitutionId,
                  token: adminToken,
                  subInstitutionIsValidated: true,
                  subInstitutionCreatedByAdmin: false,
                  expectedHTTPStatus: 200,
                };
                await testGetSubInstitution(testGetConfig);
              });
            });
          });
          afterAll(async () => {
            await deleteInstitutionAsAdmin(subInstitutionId);
          });
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

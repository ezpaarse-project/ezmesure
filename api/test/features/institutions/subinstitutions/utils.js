const ezmesure = require('../../../setup/ezmesure');

async function testCreateSubInstitution(testConfig) {
  const {
    masterInstitutionId,
    subInstitutionId,
    token,
    subInstitutionIsValidated,
    subInstitutionCreatedByAdmin,
    expectedHTTPStatus,
  } = testConfig;

  const subInstitutionTest = {
    name: 'Sub Test',
    namespace: 'sub-test',
  };

  const res = await ezmesure({
    method: 'PUT',
    url: `/institutions/${masterInstitutionId}/subinstitutions/${subInstitutionId}`,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (expectedHTTPStatus !== 200) { return; }

  const institution = res?.data;

  const subInstitutions = institution.childInstitutions;
  expect(subInstitutions.length).toEqual(1);

  const subInstitution = subInstitutions.find((e) => e.name === subInstitutionTest.name);

  if (!subInstitutionCreatedByAdmin) { subInstitutionTest.namespace = null; }

  expect(subInstitution?.id).not.toBeNull();
  expect(subInstitution).toHaveProperty('parentInstitutionId', masterInstitutionId);
  expect(subInstitution?.createdAt).not.toBeNull();
  expect(subInstitution?.updatedAt).not.toBeNull();
  expect(subInstitution).toHaveProperty('name', subInstitutionTest.name);
  expect(subInstitution).toHaveProperty('namespace', subInstitutionTest.namespace);
  expect(subInstitution).toHaveProperty('validated', subInstitutionIsValidated);
  expect(subInstitution).toHaveProperty('hidePartner', false);
  expect(subInstitution).toHaveProperty('tags', []);
  expect(subInstitution).toHaveProperty('logoId', null);
  expect(subInstitution).toHaveProperty('type', null);
  expect(subInstitution).toHaveProperty('acronym', null);
  expect(subInstitution).toHaveProperty('websiteUrl', null);
  expect(subInstitution).toHaveProperty('city', null);
  expect(subInstitution).toHaveProperty('uai', null);
  expect(subInstitution).toHaveProperty('social', null);
  expect(subInstitution).toHaveProperty('sushiReadySince', null);
}

async function testDeleteSubInstitution(testConfig) {
  const {
    masterInstitutionId,
    subInstitutionId,
    token,
    expectedHTTPStatus,
  } = testConfig;

  const res = await ezmesure({
    method: 'DELETE',
    url: `/institutions/${masterInstitutionId}/subinstitutions/${subInstitutionId}`,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  expect(res).toHaveProperty('status', expectedHTTPStatus);
}

async function testGetSubInstitution(testConfig) {
  const {
    masterInstitutionId,
    token,
    subInstitutionIsValidated,
    subInstitutionCreatedByAdmin,
    expectedHTTPStatus,
  } = testConfig;

  const subInstitutionTest = {
    name: 'Sub Test',
    namespace: 'sub-test',
  };

  const res = await ezmesure({
    method: 'GET',
    url: `/institutions/${masterInstitutionId}/subinstitutions`,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  expect(res).toHaveProperty('status', expectedHTTPStatus);

  if (expectedHTTPStatus !== 200) { return; }

  const subInstitutions = res?.data;

  if (subInstitutions?.length === 0) { return; }

  const subInstitution = subInstitutions.find((e) => e.name === subInstitutionTest.name);

  if (!subInstitutionCreatedByAdmin) { subInstitutionTest.namespace = null; }

  expect(subInstitution?.id).not.toBeNull();
  expect(subInstitution).toHaveProperty('parentInstitutionId', masterInstitutionId);
  expect(subInstitution?.createdAt).not.toBeNull();
  expect(subInstitution?.updatedAt).not.toBeNull();
  expect(subInstitution).toHaveProperty('name', subInstitutionTest.name);
  expect(subInstitution).toHaveProperty('namespace', subInstitutionTest.namespace);
  expect(subInstitution).toHaveProperty('validated', subInstitutionIsValidated);
  expect(subInstitution).toHaveProperty('hidePartner', false);
  expect(subInstitution).toHaveProperty('tags', []);
  expect(subInstitution).toHaveProperty('logoId', null);
  expect(subInstitution).toHaveProperty('type', null);
  expect(subInstitution).toHaveProperty('acronym', null);
  expect(subInstitution).toHaveProperty('websiteUrl', null);
  expect(subInstitution).toHaveProperty('city', null);
  expect(subInstitution).toHaveProperty('uai', null);
  expect(subInstitution).toHaveProperty('social', null);
  expect(subInstitution).toHaveProperty('sushiReadySince', null);
}

module.exports = {
  testCreateSubInstitution,
  testDeleteSubInstitution,
  testGetSubInstitution,
};

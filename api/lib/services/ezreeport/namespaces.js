const ezrAxios = require('./axios');

/** @typedef {import('@prisma/client').Institution} Institution */

/**
 * Updates (or create) a namespace in ezREEPORT from an ezMESURE's institution
 *
 * @param {Institution} institution
 * @returns The created namespace
 */
async function upsertNamespaceFromInstitution(institution) {
  const body = {
    name: institution.name,
    logoId: institution.logoId,
    fetchLogin: { elastic: { username: `report.${institution.id}` } },
    fetchOptions: {},
  };
  const { data } = await ezrAxios.put(`/admin/namespaces/${institution.id}`, body);

  return data?.content;
}

/**
 * Delete a namespace in ezREEPORT from an ezMESURE's institution
 *
 * @param {Institution} institution
 */
async function deleteNamespaceFromInstitution(institution) {
  await ezrAxios.delete(`/admin/namespaces/${institution.id}`);
}

module.exports = {
  upsertFromInstitution: upsertNamespaceFromInstitution,
  deleteFromInstitution: deleteNamespaceFromInstitution,
};

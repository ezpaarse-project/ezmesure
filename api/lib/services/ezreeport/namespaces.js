// @ts-check
const $fetch = require('./http');

/** @typedef {import('../../.prisma/client.mjs').Institution} Institution */

/**
 * Updates (or create) a namespace in ezREEPORT from an ezMESURE's institution
 *
 * @param {Institution} institution
 * @returns The updated/created namespace
 */
async function upsertNamespaceFromInstitution(institution) {
  const body = {
    name: institution.name,
    logoId: institution.logoId || undefined,
    fetchLogin: { elastic: { username: `report.${institution.id}` } },
    fetchOptions: { elastic: {} },
  };
  const { content } = await $fetch(`/admin/namespaces/${institution.id}`, {
    method: 'PUT',
    body,
  });

  return content;
}

/**
 * Delete a namespace in ezREEPORT from an ezMESURE's institution
 *
 * @param {Institution} institution
 */
async function deleteNamespaceFromInstitution(institution) {
  await $fetch(`/admin/namespaces/${institution.id}`, {
    method: 'DELETE',
  });
}

module.exports = {
  upsertFromInstitution: upsertNamespaceFromInstitution,
  deleteFromInstitution: deleteNamespaceFromInstitution,
};

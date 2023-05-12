// @ts-check
const ezrAxios = require('./axios');

/** @typedef {import('@prisma/client').Membership} Membership */

/**
 * Updates (or create) a membership in ezREEPORT from an ezMESURE's membership
 *
 * @param {Membership} membership
 * @returns The updated/created membership
 */
async function upsertMembershipFromMembership(membership) {
  const body = {
    access: membership.permissions.find((p) => p === 'reporting:write') ? 'READ_WRITE' : 'READ',
  };
  const { data } = await ezrAxios.put(`/admin/namespaces/${membership.institutionId}/members/${membership.username}`, body);

  return data?.content;
}

/**
 * Delete a namespace in ezREEPORT from an ezMESURE's namespace
 *
 * @param {Membership} membership
 */
async function deleteMembershipFromMembership(membership) {
  await ezrAxios.delete(`/admin/namespaces/${membership.institutionId}/members/${membership.username}`);
}

module.exports = {
  upsertFromMembership: upsertMembershipFromMembership,
  deleteFromMembership: deleteMembershipFromMembership,
};

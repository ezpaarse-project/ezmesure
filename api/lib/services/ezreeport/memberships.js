// @ts-check
const $fetch = require('./http');

/** @typedef {import('../../.prisma/client.mjs').Membership} Membership */

/**
 * Updates (or create) a membership in ezREEPORT from an ezMESURE's membership
 *
 * @param {Membership} membership
 * @returns The updated/created membership
 */
async function upsertMembershipFromMembership(membership) {
  const body = {
    access: membership.permissions.some((p) => p === 'reporting:write') ? 'READ_WRITE' : 'READ',
  };
  const { content } = await $fetch(`/admin/namespaces/${membership.institutionId}/memberships/${membership.username}`, {
    method: 'PUT',
    body,
  });

  return content;
}

/**
 * Delete a namespace in ezREEPORT from an ezMESURE's namespace
 *
 * @param {Membership} membership
 */
async function deleteMembershipFromMembership(membership) {
  await $fetch(`/admin/namespaces/${membership.institutionId}/memberships/${membership.username}`, {
    method: 'DELETE',
  });
}

module.exports = {
  upsertFromMembership: upsertMembershipFromMembership,
  deleteFromMembership: deleteMembershipFromMembership,
};

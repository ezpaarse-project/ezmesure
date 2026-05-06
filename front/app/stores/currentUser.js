import {
  defineStore,
  ref,
  computed,
  createError,
} from '#imports';

export const useCurrentUserStore = defineStore('current-user', () => {
  const memberships = ref([]);
  const elasticRoles = ref([]);

  const hasMemberships = computed(() => !!memberships.value?.length);
  const institutions = computed(() => memberships.value.map((m) => m.institution));

  /**
   * Permissions of current user on spaces
   */
  const spacesPermissions = computed(() => {
    const entries = memberships.value.flatMap((m) => {
      const perms = m.spacePermissions ?? [];
      return perms.map((p) => [p.spaceId, p]);
    });
    return Array.from(new Map(entries).values());
  });

  /**
   * Permissions of current user on repositories
   */
  const reposPermissions = computed(() => {
    const entries = memberships.value.flatMap((m) => {
      const perms = m.repositoryPermissions ?? [];
      return perms.map((p) => [p.repositoryPattern, p]);
    });
    return Array.from(new Map(entries).values());
  });

  /**
   * Permissions of current user on foreign spaces
   */
  const foreignSpacesPermissions = computed(() => {
    const entries = elasticRoles.value.flatMap((elasticRole) => {
      const perms = (elasticRole.spacePermissions ?? []);
      return perms.map(({ space }) => [space.id, { space, elasticRole }]);
    });
    return Array.from(new Map(entries).values());
  });

  /**
   * Fetch memberships of current user
   */
  async function fetchMemberships() {
    const mems = await $fetch('/api/auth/memberships', {
      query: {
        include: [
          'institution.customProps.field', // Used to show details in institution page
          'spacePermissions.space', // Used to show spaces in menu & institution page
          'repositoryPermissions.repository', // Used to show repositories in institution page
          'institution.elasticRoles.spacePermissions.space', // Used to show spaces in menu & institution page
          'institution.elasticRoles.repositoryPermissions.repository', // Used to show repositories in institution page
          'roles.role', // Used to show roles in institution page
        ],
        size: 0,
      },
    });

    const roles = await $fetch('/api/auth/elastic-roles', {
      query: {
        include: [
          'spacePermissions.space', // Used to show spaces in menu
        ],
        size: 0,
      },
    });

    memberships.value = mems ?? [];
    elasticRoles.value = roles ?? [];

    return true;
  }

  /**
   * Get membership of current user about an institution
   *
   * @param {string} institutionId - The ID of the institution
   * @param {{ throwOnNoMembership: boolean }} opts - Options
   *
   * @returns The membership, or `null` if not found
   */
  function getMembership(institutionId, opts) {
    const membership = memberships.value.find((m) => m.institution.id === institutionId);
    if (!membership && opts?.throwOnNoMembership) {
      throw createError({ statusCode: 403, fatal: true });
    }
    return membership;
  }

  /**
   * Get if current user have given permission on an institution
   *
   * @param {string} institutionId - The ID of the institution
   * @param {string} permission - The permission
   * @param {{ throwOnNoRights?: boolean }} opts - Options
   *
   * @returns If have permission
   */
  function hasPermission(institutionId, permission, opts) {
    const membership = getMembership(institutionId, opts);
    const perms = new Set(membership?.permissions);
    const has = perms.has(permission);
    if (!has && opts?.throwOnNoRights) {
      throw createError({ statusCode: 403, fatal: true });
    }
    return has;
  }

  return {
    hasMemberships,
    memberships,
    institutions,
    spacesPermissions,
    foreignSpacesPermissions,
    reposPermissions,
    fetchMemberships,
    getMembership,
    hasPermission,
  };
});

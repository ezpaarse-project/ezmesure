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

  const spacesPermissions = computed(() => {
    const entries = memberships.value.flatMap((m) => m.spacePermissions ?? []);
    return Array.from(new Map(entries).values());
  });

  const reposPermissions = computed(() => {
    const entries = memberships.value.flatMap((m) => m.repositoryPermissions ?? []);
    return Array.from(new Map(entries).values());
  });

  const foreignSpacesPermissions = computed(() => {
    const entries = elasticRoles.value.flatMap((elasticRole) => {
      const perms = (elasticRole.spacePermissions ?? []);
      return perms.map(({ space }) => [space.id, { space, elasticRole }]);
    });
    return Array.from(new Map(entries).values());
  });

  async function fetchMemberships() {
    const mems = await $fetch('/api/profile/memberships', {
      query: {
        include: [
          'institution.customProps.field', // Used to show details in institution page
          'spacePermissions.space', // Used to show spaces in menu & institution page
          'repositoryPermissions.repository', // Used to show repositories in institution page
          'institution.elasticRoles.spacePermissions.space', // Used to show spaces in menu & institution page
          'institution.elasticRoles.repositoryPermissions.repository', // Used to show repositories in institution page
        ],
        size: 0,
      },
    });

    const roles = await $fetch('/api/profile/elastic-roles', {
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

  function getMembership(institutionId, opts) {
    const membership = memberships.value.find((m) => m.institution.id === institutionId);
    if (!membership && opts?.throwOnNoMembership) {
      throw createError({ statusCode: 403, fatal: true });
    }
    return membership;
  }

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

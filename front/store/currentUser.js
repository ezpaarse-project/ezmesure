import {
  defineStore,
  ref,
  computed,
  createError,
} from '#imports';

export const useCurrentUserStore = defineStore('current-user', () => {
  const memberships = ref([]);

  const hasMemberships = computed(() => !!memberships.value?.length);
  const institutions = computed(() => memberships.value.map((m) => m.institution));
  const spacesPermissions = computed(
    () => memberships.value.flatMap((m) => m.spacePermissions ?? []),
  );
  const reposPermissions = computed(
    () => memberships.value.flatMap((m) => m.repositoryPermissions ?? []),
  );

  async function fetchMemberships() {
    const data = await $fetch('/api/profile/memberships', {
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

    memberships.value = data ?? [];
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
    reposPermissions,
    fetchMemberships,
    getMembership,
    hasPermission,
  };
});

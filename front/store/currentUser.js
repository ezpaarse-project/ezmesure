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
    () => memberships.value.map((m) => m.spacePermissions ?? []).flat(),
  );
  const reposPermissions = computed(
    () => memberships.value.map((m) => m.repositoryPermissions ?? []).flat(),
  );

  async function fetchMemberships() {
    const data = await $fetch('/api/profile/memberships', {
      query: {
        include: ['institution', 'spacePermissions.space', 'repositoryPermissions.repository'],
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

import {
  defineStore,
  ref,
  computed,
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
      },
    });

    memberships.value = data ?? [];
    return true;
  }

  return {
    hasMemberships,
    memberships,
    institutions,
    spacesPermissions,
    reposPermissions,
    fetchMemberships,
  };
});

<template>
  <v-list
    variant="flat"
    lines="two"
    density="compact"
    class="py-0"
  >
    <v-menu
      v-for="{ institution, permissions, spacePermissions } in items"
      :key="institution.id"
      :open-on-click="$vuetify.display.mobile"
      location="end top"
      open-delay="100"
      open-on-hover
    >
      <template #activator="{ props: menu }">
        <CurrentUserInstitutionListItem
          :institution="institution"
          append-icon="mdi-chevron-right"
          class="text-grey-darken-3"
          v-bind="menu"
          @click.prevent=""
        />
      </template>

      <CurrentUserInstitutionListItemActions
        :institution="institution"
        :permissions="permissions"
        :space-permissions="spacePermissions"
        :show-update="!!institutionFormDialogRef"
      />
    </v-menu>

    <CurrentUserInstitutionJoinListItem
      @click:create="institutionFormDialogRef?.open(undefined, { addAsMember: true })"
    />

    <InstitutionFormDialog
      ref="institutionFormDialogRef"
      @update:model-value="currentUser.fetchMemberships()"
    />
  </v-list>
</template>

<script setup>
const currentUser = useCurrentUserStore();
const { memberships } = storeToRefs(currentUser);

const institutionFormDialogRef = useTemplateRef('institutionFormDialogRef');

const items = computed(() => memberships.value.filter((m) => {
  const perms = new Set(m.permissions);

  return perms.has('institution:read') || perms.has('institution:write');
}));
</script>

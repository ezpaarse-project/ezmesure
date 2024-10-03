<template>
  <v-list-item
    :title="$t('menu.myInstitutions')"
    :append-icon="expanded ? 'mdi-chevron-double-up' : 'mdi-chevron-double-down'"
    prepend-icon="mdi-domain"
    class="text-grey-darken-3"
    @click="expanded = !expanded"
  />

  <v-expand-transition>
    <v-list
      v-if="expanded"
      variant="flat"
      lines="two"
      density="compact"
      class="pt-0"
    >
      <v-menu
        v-for="{ institution, permissions } in items"
        :key="institution.id"
        :open-on-click="$vuetify.display.mobile"
        location="end top"
        open-delay="100"
        open-on-hover
      >
        <!-- open-on-click if mobile -->
        <template #activator="{ props: menu }">
          <CurrentUserInstitutionListItem
            :institution="institution"
            append-icon="mdi-chevron-right"
            class="text-grey-darken-3"
            v-bind="menu"
            @click.prevent=""
          />
        </template>

        <CurrentUserInstitutionActions
          :institution="institution"
          :permissions="permissions"
          :show-update="!!institutionFormDialogRef"
          @click:update="institutionFormDialogRef?.open($event)"
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
  </v-expand-transition>
</template>

<script setup>
const currentUser = useCurrentUserStore();
const { memberships } = storeToRefs(currentUser);

const expanded = ref(true);

const institutionFormDialogRef = useTemplateRef('institutionFormDialogRef');

const items = computed(() => memberships.value.map((m) => {
  const perms = new Set(m.permissions);

  return {
    institution: m.institution,
    permissions: {
      institution: perms.has('institution:write'),
      sushi: perms.has('sushi:read') || perms.has('sushi:write'),
      members: perms.has('memberships:read') || perms.has('memberships:write'),
      reports: perms.has('reporting:read') || perms.has('reporting:write'),
    },
  };
}));
</script>

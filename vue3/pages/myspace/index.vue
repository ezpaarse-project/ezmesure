<template>
  <div>
    <SkeletonPageBar :title="$t('menu.myInstitutions')" />

    <v-container>
      <v-row>
        <v-col
          v-for="membership in items"
          :key="membership.institution.id"
          cols="12"
          md="6"
          xl="4"
        >
          <CurrentUserInstitutionCard
            :membership="membership"
            @click:update="institutionFormDialogRef.open($event)"
          />
        </v-col>
      </v-row>
    </v-container>

    <InstitutionFormDialog
      ref="institutionFormDialogRef"
      @update:model-value="currentUser.fetchMemberships()"
    />
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'space',
  middleware: ['auth', 'terms'],
});

const currentUser = useCurrentUserStore();
const { memberships } = storeToRefs(currentUser);

const institutionFormDialogRef = useTemplateRef('institutionFormDialogRef');

const items = computed(() => memberships.value.filter((m) => {
  const perms = new Set(m.permissions);

  return perms.has('institution:read') || perms.has('institution:write');
}));
</script>

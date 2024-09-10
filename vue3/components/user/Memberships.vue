<template>
  <v-card
    :title="$t('users.user.memberships')"
    :subtitle="showUser ? user.fullName : undefined"
    :loading="status === 'pending'"
    prepend-icon="mdi-domain"
  >
    <template #append>
      <v-btn
        v-tooltip="$t('refresh')"
        icon="mdi-reload"
        variant="text"
        density="comfortable"
        color="primary"
        @click="refresh()"
      />
    </template>

    <template #text>
      <div v-if="(memberships?.length ?? 0) <= 0" class="text-center text-grey pt-5">
        {{ $t('users.user.no_institution') }}
      </div>

      <v-list v-else>
        <v-list-item
          v-for="membership in memberships ?? []"
          :key="membership.institutionId"
          lines="two"
        >
          <template #prepend>
            <InstitutionAvatar :institution="membership.institution" />
          </template>

          <template #title>
            <nuxt-link :to="`/admin/institutions/${membership.institutionId}/members`">
              {{ membership.institution.name }}
            </nuxt-link>
          </template>

          <template #subtitle>
            <v-chip
              v-for="role in membership.roles"
              :key="role"
              :text="$t(`institutions.members.roleNames.${role}`)"
              :prepend-icon="roleColors.get(role)?.icon"
              :color="roleColors.get(role)?.color"
              size="small"
              label
              class="mr-1"
            />
          </template>

          <template #append>
            <v-btn
              v-if="membershipFormDialogRef"
              v-tooltip="$t('update')"
              icon="mdi-pencil"
              variant="text"
              size="small"
              density="comfortable"
              color="blue"
              @click="membershipFormDialogRef.open(
                { ...membership, user },
                { institution: membership.institution },
              )"
            />

            <ConfirmPopover
              :text="$t('areYouSure')"
              :agree-text="$t('delete')"
              :agree="() => removeMembership(membership)"
              location="end"
            >
              <template #activator="{ props: confirm }">
                <v-btn
                  v-tooltip="$t('revoke')"
                  icon="mdi-account-off"
                  variant="text"
                  size="small"
                  density="comfortable"
                  color="red"
                  v-bind="confirm"
                />
              </template>
            </ConfirmPopover>
          </template>
        </v-list-item>
      </v-list>
    </template>

    <template v-if="$slots.actions" #actions>
      <v-spacer />

      <slot name="actions" />
    </template>

    <MembershipFormDialog
      ref="membershipFormDialogRef"
      @update:model-value="onMembershipAdded()"
    />
  </v-card>
</template>

<script setup>
const props = defineProps({
  user: {
    type: Object,
    required: true,
  },
  showUser: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits({
  'update:modelValue': (items) => !!items,
});

const { t } = useI18n();
const snacks = useSnacksStore();

const {
  status,
  data: memberships,
  refresh,
} = useFetch(`/api/users/${props.user.username}/memberships`, {
  lazy: true,
  params: {
    include: ['institution', 'spacePermissions', 'repositoryPermissions'],
    sort: 'institution.name',
    size: 0,
  },
});

const membershipFormDialogRef = useTemplateRef('membershipFormDialogRef');

async function onMembershipAdded() {
  await refresh();
  emit('update:modelValue', memberships.value);
}

async function removeMembership(item) {
  try {
    await $fetch(`/api/institutions/${item.institutionId}/memberships/${props.user.username}`, {
      method: 'DELETE',
    });

    memberships.value = memberships.value.filter((i) => i.institutionId !== item.institutionId);

    emit('update:modelValue', memberships.value);
  } catch {
    snacks.error(t('anErrorOccurred'));
  }
}
</script>

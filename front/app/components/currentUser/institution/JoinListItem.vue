<template>
  <v-menu v-model="isOpen" :close-on-content-click="false" width="500">
    <template #activator="{ props: dialog }">
      <v-list-item
        :title="$t('institutions.askToJoinAnInstitution')"
        class="text-grey-darken-3"
        v-bind="dialog"
      >
        <template #prepend>
          <v-avatar icon="mdi-plus-circle-outline" border="0" />
        </template>
      </v-list-item>
    </template>

    <v-card
      :title="$t('institutions.askToJoinAnInstitution')"
      prepend-icon="mdi-domain-switch"
    >
      <template #append>
        <v-btn
          icon="mdi-close"
          color="secondary"
          variant="text"
          density="comfortable"
          @click="isOpen = false"
        />
      </template>

      <template #text>
        <v-autocomplete
          v-model:search="search"
          :items="institutions ?? []"
          :label="$t('institutions.institution.name')"
          :loading="status === 'pending'"
          hide-details="auto"
          item-value="id"
          item-title="name"
          no-filter
          autofocus
        >
          <template #no-data>
            <v-list-item
              :title="$t('institutions.institutionFoundDeclareNewInstitution')"
              prepend-icon="mdi-plus"
              @click="$emit('click:create'); isOpen = false"
            />
          </template>

          <template #item="{ item: { raw: item }, props: listItem }">
            <v-list-item
              :disabled="membershipIds.has(item.id)"
              v-bind="listItem"
              @click="askToJoinAnInstitution(item)"
            >
              <template #prepend>
                <InstitutionAvatar :institution="item" />
              </template>

              <template v-if="item.openAccess" #append>
                <v-chip
                  :text="$t('institutions.institution.openAccess.title')"
                  prepend-icon="mdi-lock-open-outline"
                  color="success"
                  size="small"
                />
              </template>
            </v-list-item>
          </template>
        </v-autocomplete>
      </template>
    </v-card>
  </v-menu>
</template>

<script setup>
defineEmits({
  'click:create': () => true,
});

const { fetchMemberships } = useCurrentUserStore();
const { memberships } = storeToRefs(useCurrentUserStore());
const { t } = useI18n();
const { openConfirm } = useConfirmStore();
const snacks = useSnacksStore();

const isOpen = shallowRef(false);
const search = shallowRef('');

const debouncedSearch = debouncedRef(search);

const {
  data: institutions,
  status,
} = await useFetch('/api/institutions', {
  query: {
    q: debouncedSearch,
    sort: 'name',
  },
});

const membershipIds = computed(() => new Set(memberships.value.map((m) => m.institutionId)));

async function joinOpenInstitution(institution) {
  await openConfirm({
    text: `${t('institutions.joinInstitution', { institution: institution.name })} ${t('institutions.joinInstitutionOpen')}`,
    agreeText: t('institutions.join'),
    onAgree: async () => {
      try {
        await $fetch(`/api/profile/memberships/${institution.id}`, { method: 'PUT' });
        await fetchMemberships();
        snacks.info(t('institutions.joinSuccess'));
        isOpen.value = false;
      } catch (err) {
        snacks.error(t('anErrorOccurred'), err);
      }
    },
  });
}

async function askToJoinAnInstitution(institution) {
  if (institution.openAccess) {
    await joinOpenInstitution(institution);
    return;
  }

  await openConfirm({
    text: `${t('institutions.joinInstitution', { institution: institution.name })} ${t('institutions.joinInstitutionEmail')}`,
    agreeText: t('yes'),
    agreeIcon: 'mdi-email-fast-outline',
    onAgree: async () => {
      try {
        await $fetch(`/api/institutions/${institution.id}/_request_membership`, {
          method: 'POST',
        });
        snacks.info(t('institutions.sendMailToJoin'));
        isOpen.value = false;
      } catch (err) {
        snacks.error(t('anErrorOccurred'), err);
      }
    },
  });
}
</script>

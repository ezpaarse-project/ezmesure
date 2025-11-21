<template>
  <v-dialog
    v-model="isOpen"
    :width="loading ? 200 : 900"
    scrollable
  >
    <LoaderCard v-if="loading" />

    <v-card
      v-else
      :title="$t('institutions.members.title', { count: membershipRoles.length })"
      :subtitle="roleData?.label"
    >
      <template #append>
        <v-btn
          v-if="emails.length"
          v-tooltip:bottom="$t('users.createMailUserList', { count: emails.length })"
          icon="mdi-email"
          variant="tonal"
          density="comfortable"
          color="primary"
          class="mr-2"
          @click="copyEmails()"
        />

        <v-text-field
          v-if="membershipRoles.length > 0"
          v-model="search"
          :placeholder="$t('search')"
          append-inner-icon="mdi-magnify"
          variant="outlined"
          density="compact"
          width="200"
          hide-details
          class="mr-2"
        />
      </template>

      <template #text>
        <v-empty-state
          v-if="errorMessage"
          :icon="errorIcon"
          :title="errorMessage"
        >
          <template #actions>
            <v-btn
              :text="$t('close')"
              variant="text"
              @click="isOpen = false"
            />

            <v-btn
              :text="$t('retry')"
              :loading="loading"
              variant="elevated"
              color="secondary"
              @click="refreshForm"
            />
          </template>
        </v-empty-state>

        <v-data-table
          v-else
          :headers="headers"
          :search="search"
          :items="membershipRoles"
          :loading="loading"
          :sort-by="[{ key: 'institution.name', order: 'asc' }]"
          density="comfortable"
        >
          <template #[`item.institution.name`]="{ item }">
            <InstitutionAvatar :institution="item.membership.institution" size="x-small" class="mr-2" />

            <nuxt-link :to="`/admin/institutions/${item.institutionId}`">
              {{ item.membership.institution.name }}
            </nuxt-link>
          </template>
        </v-data-table>
      </template>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { getErrorMessage } from '@/lib/errors';

const { t } = useI18n();
const { copy } = useClipboard();
const snacks = useSnacksStore();

const isOpen = shallowRef(false);
const roleId = shallowRef(null);

const roleData = ref(null);
const search = shallowRef('');
const loading = shallowRef(false);
const errorMessage = shallowRef('');
const errorIcon = shallowRef('');

const membershipRoles = computed(() => roleData.value?.membershipRoles ?? []);
const emails = computed(() => Array.from(new Set(
  membershipRoles.value.map((membershipRole) => membershipRole?.membership?.user?.email),
)));

const headers = computed(() => [
  {
    title: t('institutions.title'),
    value: 'institution.name',
    sortable: true,
    maxWidth: '700px',
  },
  {
    title: t('users.user.username'),
    value: 'membership.user.fullName',
    maxWidth: '200px',
  },
]);

async function refreshForm() {
  if (!roleId.value) {
    return;
  }

  loading.value = true;

  try {
    roleData.value = await $fetch(`/api/roles/${roleId.value}`, {
      query: {
        include: [
          'membershipRoles.membership.institution',
          'membershipRoles.membership.user',
        ],
      },
    });
  } catch (err) {
    errorMessage.value = getErrorMessage(err, t('anErrorOccurred'));
    errorIcon.value = err?.statusCode === 404 ? 'mdi-file-hidden' : 'mdi-alert-circle';
  }

  loading.value = false;
}

async function copyEmails() {
  try {
    await copy(emails.value.join('; '));
  } catch (err) {
    snacks.error(t('clipboard.unableToCopy'), err);
    return;
  }
  snacks.info(t('emailsCopied'));
}

async function open(customField) {
  roleData.value = null;
  loading.value = false;
  errorMessage.value = '';
  errorIcon.value = '';

  roleId.value = customField?.id;
  isOpen.value = true;
  await refreshForm();
}

defineExpose({
  open,
});
</script>

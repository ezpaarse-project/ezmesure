<template>
  <v-dialog
    v-model="isOpen"
    :width="loading ? 200 : 1200"
    scrollable
  >
    <LoaderCard v-if="loading" />

    <v-card
      v-else
    >
      <template #prepend>
        <RoleChip :role="roleData" />
      </template>

      <template #title>
        {{ $t('institutions.members.title', { count: membershipRoles.length }) }}
      </template>

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
            <v-list-item class="px-0">
              <template #title>
                <nuxt-link :to="`/admin/institutions/${item.institutionId}`" class="text-wrap">
                  {{ item.membership.institution.name }}
                </nuxt-link>
              </template>

              <template #prepend>
                <InstitutionAvatar :institution="item.membership.institution" size="x-small" class="mr-2" />
              </template>
            </v-list-item>
          </template>

          <template #[`item.membership.user.fullName`]="{ item }">
            <v-list-item
              :title="item.membership.user.fullName"
              :subtitle="item.membership.user.email"
              class="px-0"
            />
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
    width: '60%',
  },
  {
    title: t('users.user.username'),
    value: 'membership.user.fullName',
    width: '40%',
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
  search.value = '';

  roleId.value = customField?.id;
  isOpen.value = true;
  await refreshForm();
}

defineExpose({
  open,
});
</script>

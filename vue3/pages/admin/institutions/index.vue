<template>
  <div>
    <SkeletonPageBar :title="toolbarTitle">
      <v-btn
        v-tooltip="$t('add')"
        icon="mdi-plus"
        density="comfortable"
        class="mr-2"
        @click="showForm()"
      />
      <v-btn
        v-tooltip="$t('refresh')"
        :loading="status === 'pending'"
        icon="mdi-reload"
        density="comfortable"
        class="mr-2"
        @click="refresh()"
      />

      <v-text-field
        v-model="queryOptions.search"
        :placeholder="$t('search')"
        append-inner-icon="mdi-magnify"
        variant="outlined"
        density="compact"
        hide-details
        class="mr-2"
        style="max-width: 200px"
        @update:model-value="debouncedRefresh()"
      />
    </SkeletonPageBar>

    <v-data-table-server
      v-model="selectedInstitutions"
      :items="institutions"
      :items-length="institutionsLength"
      :headers="headers"
      :page="queryOptions.page"
      :items-per-page="queryOptions.itemsPerPage"
      :sort-by="queryOptions.sortBy"
      :loading="status === 'pending'"
      show-select
      return-object
      @update:options="(queryOptions = $event) && refresh()"
    >
      <template #[`item.name`]="{ item }">
        <nuxt-link :to="`/admin/institutions/${item.id}`">
          {{ item.name }}
        </nuxt-link>
      </template>

      <template #[`item.memberships`]="{ item, value }">
        <v-chip
          :text="`${value.length}`"
          :to="`/admin/institutions/${item.id}/members`"
          :variant="!value.length ? 'outlined' : undefined"
          prepend-icon="mdi-account-multiple"
          size="small"
        />
      </template>

      <template #[`item.childInstitutions`]="{ value }">
        <v-chip
          :text="`${value.length}`"
          :variant="!value.length ? 'outlined' : undefined"
          prepend-icon="mdi-family-tree"
          size="small"
          @click.prevent=""
        />
      </template>

      <template #[`item.repositories`]="{ value }">
        <v-chip
          :text="`${value.length}`"
          :variant="!value.length ? 'outlined' : undefined"
          prepend-icon="mdi-database-outline"
          size="small"
          @click.prevent=""
        />
      </template>

      <template #[`item.spaces`]="{ value }">
        <v-chip
          :text="`${value.length}`"
          :variant="!value.length ? 'outlined' : undefined"
          prepend-icon="mdi-tab"
          size="small"
          @click.prevent=""
        />
      </template>

      <template #[`item.sushiCredentials`]="{ value, item }">
        <v-chip
          :text="`${value.length}`"
          :variant="!value.length ? 'outlined' : undefined"
          :to="`/admin/institutions/${item.id}/sushi`"
          prepend-icon="mdi-key"
          size="small"
        />
      </template>

      <template #[`item.validated`]="{ value, item }">
        <ConfirmPopover
          :title="$t('areYouSure')"
          :text="$t('institutions.validateNbInstitutions', 1)"
          :agree-text="$t('confirm')"
          :agree="() => activateInstitutions([item])"
          location="bottom start"
        >
          <template #activator="{ props }">
            <v-switch
              :model-value="value"
              :label="value
                ? $t('institutions.institution.validated')
                : $t('institutions.institution.notValidated')"
              density="comfortable"
              color="primary"
              hide-details
              readonly
              style="transform: scale(0.8);"
              v-bind="props"
            />
          </template>
        </ConfirmPopover>
      </template>

      <template #[`item.actions`]="{ item }">
        <v-menu>
          <template #activator="{ props: menu }">
            <v-btn
              icon="mdi-cog"
              variant="plain"
              density="compact"
              v-bind="menu"
            />
          </template>

          <v-list>
            <v-list-item
              :title="$t('modify')"
              prepend-icon="mdi-pencil"
              @click="showForm(item)"
            />
            <v-list-item
              :title="$t('delete')"
              prepend-icon="mdi-delete"
              @click="deleteInstitutions([item])"
            />

            <v-divider />

            <v-list-item
              :title="$t('institutions.sushi.credentials')"
              :to="`/admin/institutions/${item.id}/sushi`"
              prepend-icon="mdi-key"
            />
            <v-list-item
              :title="$t('institutions.members.members')"
              :to="`/admin/institutions/${item.id}/members`"
              prepend-icon="mdi-account-multiple"
            />
            <v-list-item
              :title="$t('institutions.reports.reports')"
              :to="`/admin/institutions/${item.id}/reports`"
              prepend-icon="mdi-file-chart-outline"
            />
            <v-list-item
              v-if="clipboardAvailable"
              :title="$t('copyId')"
              prepend-icon="mdi-identifier"
              @click="copyInstitutionId(item)"
            />
          </v-list>
        </v-menu>
      </template>
    </v-data-table-server>

    <SelectionMenu
      :text="$t('institutions.manageInstitutions', selectedInstitutions.length)"
      :selected="selectedInstitutions"
    >
      <template #actions>
        <v-list-item
          :title="$t('delete')"
          prepend-icon="mdi-delete"
          @click="deleteInstitutions()"
        />
        <v-list-item
          :title="$t('institutions.validateSwitch')"
          prepend-icon="mdi-check"
          @click="activateInstitutions()"
        />
      </template>
    </SelectionMenu>

    <v-dialog
      v-model="showInstitutionForm"
      width="900"
      scrollable
      persistent
    >
      <InstitutionForm
        ref="institutionFormRef"
        v-model:show="showInstitutionForm"
        @update:institution="refresh()"
      />
    </v-dialog>
  </div>
</template>

<script setup>
import { debounce } from 'lodash';

definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'terms', 'admin'],
});

const { t } = useI18n();
const { clipboardAvailable, writeClipboard } = useClipboard();
const { openConfirm } = useDialogStore();
const snacks = useSnacksStore();

const showInstitutionForm = ref(false);
const institutionsLength = ref(0);
const totalInstitutionsLength = ref(0);
const selectedInstitutions = ref([]);
const queryOptions = ref({
  page: 1,
  itemsPerPage: 10,
  sortBy: [{ key: 'name', order: 'asc' }],
  search: '',
});

/** @type {Ref<Object | null>} Vue ref of the institution form */
const institutionFormRef = ref(null);

const {
  data: institutions,
  refresh,
  status,
} = await useAsyncData(
  'institutions-list',
  async () => {
    try {
      const res = await $fetch.raw('/api/institutions', {
        query: {
          include: ['repositories', 'memberships', 'spaces', 'childInstitutions', 'sushiCredentials'],
          page: queryOptions.value.page,
          size: Math.max(queryOptions.value.itemsPerPage, 0),
          sort: queryOptions.value.sortBy?.[0]?.key,
          order: queryOptions.value.sortBy?.[0]?.order,
          q: queryOptions.value.search,
        },
      });

      institutionsLength.value = res.headers.get('x-total-count');
      if (!totalInstitutionsLength.value) {
        totalInstitutionsLength.value = institutionsLength.value;
      }
      // eslint-disable-next-line no-underscore-dangle
      return res._data;
    } catch (error) {
      snacks.error(t('anErrorOccurred'));
      throw error;
    }
  },
);

/**
 * Table headers
 */
const headers = computed(() => [
  {
    title: t('institutions.title'),
    value: 'name',
    sortable: true,
  },
  {
    title: t('institutions.institution.acronym'),
    value: 'acronym',
    sortable: true,
  },
  {
    title: t('institutions.institution.members'),
    value: 'memberships',
    align: 'center',
  },
  {
    title: t('components.components'),
    value: 'childInstitutions',
    align: 'center',
  },
  {
    title: t('repositories.repositories'),
    value: 'repositories',
    align: 'center',
  },
  {
    title: t('spaces.spaces'),
    value: 'spaces',
    align: 'center',
  },
  {
    title: t('sushi.credentials'),
    value: 'sushiCredentials',
    align: 'center',
  },
  {
    title: t('institutions.institution.status'),
    value: 'validated',
    align: 'center',
    sortable: true,
  },
  {
    title: t('actions'),
    value: 'actions',
    align: 'center',
  },
]);
/**
 * Toolbar title
 */
const toolbarTitle = computed(() => {
  let count = `${institutionsLength.value}`;
  if (institutionsLength.value !== totalInstitutionsLength.value) {
    count = `${institutionsLength.value}/${totalInstitutionsLength.value}`;
  }
  return t('institutions.toolbarTitle', { count: count ?? '?' });
});

/**
 * Debounced refresh
 */
const debouncedRefresh = debounce(() => refresh(), 250);

/**
 * Show creation/update form
 *
 * @param {Object} [item] The institution to edit
 */
async function showForm(item) {
  showInstitutionForm.value = true;
  await nextTick();

  if (item) {
    institutionFormRef.value?.init(item);
    return;
  }

  institutionFormRef.value?.init(undefined, { addAsMember: false });
}

/**
 * Delete multiple institutions
 *
 * @param {Object[]} [items] List of items to delete, if none it'll fall back to selected
 */
function deleteInstitutions(items) {
  const toDelete = items || selectedInstitutions.value;
  if (toDelete.length <= 0) {
    return;
  }

  openConfirm({
    title: t('areYouSure'),
    text: t(
      'institutions.deleteNbInstitutions.text',
      toDelete.length,
      { named: { affected: t('institutions.deleteNbInstitutions.affected') } },
    ),
    agreeText: t('delete'),
    agreeIcon: 'mdi-delete',
    onAgree: async () => {
      const results = await Promise.all(
        toDelete.map((item) => {
          try {
            return $fetch(`/api/institutions/${item.id}`, { method: 'DELETE' });
          } catch (e) {
            snacks.error(t('cannotDeleteItem', { id: item.name || item.id }));
            return Promise.resolve(null);
          }
        }),
      );

      if (!results.some((r) => !r)) {
        snacks.success(t('itemsDeleted', { count: toDelete.length }));
      }

      if (!items) {
        selectedInstitutions.value = [];
      }

      await refresh();
    },
  });
}

function activateInstitutions(items) {
  const toActivate = items || selectedInstitutions.value;
  if (toActivate.length <= 0) {
    return;
  }

  openConfirm({
    title: t('areYouSure'),
    text: t(
      'institutions.validateNbInstitutions',
      toActivate.length,
    ),
    onAgree: async () => {
      const results = await Promise.all(
        toActivate.map((item) => {
          try {
            const value = !item.validated;
            return $fetch(`/api/institutions/${item.id}/validated`, {
              method: 'PUT',
              body: { value },
            });
          } catch (e) {
            snacks.error(t('cannotUpdateItem', { id: item.name || item.id }));
            return Promise.resolve(null);
          }
        }),
      );

      if (!results.some((r) => !r)) {
        snacks.success(t('itemsUpdated', { count: toActivate.length }));
      }

      if (!items) {
        selectedInstitutions.value = [];
      }

      await refresh();
    },
  });
}

/**
 * Put institution ID into clipboard
 *
 * @param {object} param0 Institution
 */
async function copyInstitutionId({ id }) {
  if (!id) {
    return;
  }

  try {
    await writeClipboard(id);
  } catch (e) {
    snacks.error(t('token.copyFailed'));
    return;
  }
  snacks.info(t('token.clipped'));
}
</script>

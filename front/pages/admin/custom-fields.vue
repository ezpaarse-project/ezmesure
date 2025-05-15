<template>
  <div>
    <SkeletonPageBar
      v-model="query"
      :title="toolbarTitle"
      :refresh="refresh"
      search
      icons
      @update:model-value="debouncedRefresh()"
    >
      <v-btn
        v-if="customFieldFormDialogRef"
        v-tooltip="$t('add')"
        icon="mdi-plus"
        variant="tonal"
        density="comfortable"
        color="green"
        class="mr-2"
        @click="customFieldFormDialogRef.open()"
      />
    </SkeletonPageBar>

    <v-container fluid>
      <v-row>
        <v-col>
          <p>{{ $t('customFields.pageDesc') }}</p>
        </v-col>
      </v-row>
    </v-container>

    <v-data-table-server
      v-model="selectedCustomField"
      :headers="headers"
      show-select
      return-object
      v-bind="vDataTableOptions"
    >
      <template #[`item.properties`]="{ item }">
        <v-icon
          v-tooltip:top="$t('customFields.multivalued')"
          :color="item.multiple ? 'primary' : 'grey-lighten-2'"
          icon="mdi-label-multiple"
          class="ml-1"
        />

        <v-icon
          v-tooltip:top="$t('customFields.editableByUsers')"
          :color="item.editable ? 'primary' : 'grey-lighten-2'"
          icon="mdi-pencil"
          class="ml-1"
        />

        <v-icon
          v-tooltip:top="$t('customFields.visibleToUsers')"
          :color="item.visible ? 'primary' : 'grey-lighten-2'"
          icon="mdi-eye"
          class="ml-1"
        />
      </template>

      <template #[`item.actions`]="{ item }">
        <v-btn
          v-tooltip:top="$t('modify')"
          :disabled="!customFieldFormDialogRef"
          icon="mdi-pencil"
          variant="text"
          density="comfortable"
          color="blue"
          @click="customFieldFormDialogRef.open(item)"
        />
        <v-btn
          v-tooltip:top="$t('delete')"
          icon="mdi-delete"
          variant="text"
          density="comfortable"
          color="red"
          @click="deleteCustomField([item])"
        />
      </template>
    </v-data-table-server>

    <SelectionMenu
      v-model="selectedCustomField"
      :text="$t('customFields.manageCustomField', selectedCustomField.length)"
    >
      <template #actions>
        <v-list-item
          :title="$t('delete')"
          prepend-icon="mdi-delete"
          @click="deleteCustomField()"
        />
      </template>
    </SelectionMenu>

    <CustomFieldFormDialog
      ref="customFieldFormDialogRef"
      @submit="refresh()"
    />
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'admin',
  middleware: ['sidebase-auth', 'terms', 'admin'],
});

const { t, locale } = useI18n();
const { openConfirm } = useDialogStore();
const snacks = useSnacksStore();

const selectedCustomField = ref([]);

const customFieldFormDialogRef = useTemplateRef('customFieldFormDialogRef');

const {
  refresh,
  itemLength,
  query,
  vDataTableOptions,
} = await useServerSidePagination({
  fetch: {
    url: '/api/custom-fields',
  },
  data: {
    sortBy: [{ key: 'id', order: 'asc' }],
  },
});

/**
 * Table headers
 */
const headers = computed(() => [
  {
    title: t('identifier'),
    value: 'id',
    sortable: true,
  },
  {
    title: t('label'),
    value: locale.value === 'en' ? 'labelEn' : 'labelFr',
    sortable: true,
  },
  {
    title: t('description'),
    value: locale.value === 'en' ? 'descriptionEn' : 'descriptionFr',
    sortable: true,
  },
  {
    title: t('properties'),
    value: 'properties',
    sortable: false,
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
  let count = `${itemLength.value.current}`;
  if (itemLength.value.current !== itemLength.value.total) {
    count = `${itemLength.value.current}/${itemLength.value.total}`;
  }
  return t('customFields.toolbarTitle', { count: count ?? '?' });
});

/**
 * Debounced refresh
 */
const debouncedRefresh = useDebounceFn(refresh, 250);

/**
 * Delete multiple customFields
 *
 * @param {Object[]} [items] List of items to delete, if none it'll fall back to selected
 */
function deleteCustomField(items) {
  const toDelete = items || selectedCustomField.value;
  if (toDelete.length <= 0) {
    return;
  }

  openConfirm({
    text: t(
      'customFields.deleteNbCustomField',
      toDelete.length,
    ),
    agreeText: t('delete'),
    agreeIcon: 'mdi-delete',
    onAgree: async () => {
      const results = await Promise.all(
        toDelete.map((item) => {
          try {
            return $fetch(`/api/custom-fields/${item.id}`, { method: 'DELETE' });
          } catch (err) {
            snacks.error(t('cannotDeleteItem', { id: item.id }), err);
            return Promise.resolve(null);
          }
        }),
      );

      if (!results.some((r) => !r)) {
        snacks.success(t('itemsDeleted', { count: toDelete.length }));
      }

      if (!items) {
        selectedCustomField.value = [];
      }

      await refresh();
    },
  });
}

</script>

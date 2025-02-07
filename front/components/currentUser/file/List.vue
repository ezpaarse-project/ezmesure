<template>
  <div>
    <v-data-table
      v-model="selectedFiles"
      :items="files ?? []"
      :items-per-page="itemsPerPage"
      :loading="status === 'pending' && 'primary'"
      :headers="headers"
      item-value="name"
      show-select
    >
      <template #top>
        <div class="d-flex px-4 mb-2">
          <v-spacer />

          <v-btn
            :text="$t('refresh')"
            :loading="status === 'pending'"
            prepend-icon="mdi-reload"
            variant="tonal"
            color="primary"
            class="mr-2"
            @click="refresh()"
          />
        </div>
      </template>

      <template #[`item.size`]="{ value }">
        {{ prettySize(value) }}
      </template>

      <template #[`item.lastModified`]="{ value }">
        <LocalDate :model-value="value" format="P - pp" />
      </template>
    </v-data-table>

    <SelectionMenu
      v-model="selectedFiles"
      :text="$t('files.manageN', selectedFiles.length)"
    >
      <template #actions>
        <v-list-item
          :title="$t('delete')"
          prepend-icon="mdi-delete"
          @click="deleteFiles()"
        />
      </template>
    </SelectionMenu>
  </div>
</template>

<script setup>
import prettySize from 'pretty-bytes';

const { t } = useI18n();
const snacks = useSnacksStore();

const selectedFiles = ref([]);

const itemsPerPage = useLocalStorage('ezm.itemsPerPage', 10);

const {
  status,
  data: files,
  refresh,
} = await useFetch('/api/files', { lazy: true });

const headers = computed(() => [
  {
    title: t('files.name'),
    value: 'name',
    align: 'left',
  },
  {
    title: t('files.modified'),
    value: 'lastModified',
    align: 'left',
    width: '220px',
  },
  {
    title: t('files.size'),
    value: 'size',
    align: 'left',
    width: '120px',
  },
]);

async function deleteFiles() {
  if (selectedFiles.value.length <= 0) {
    return;
  }

  try {
    await $fetch('/api/files/delete_batch', {
      method: 'POST',
      body: {
        entries: selectedFiles.value,
      },
    });
  } catch {
    snacks.error(t('files.deletingFailed'));
  }

  selectedFiles.value = [];
  await refresh();
}
</script>

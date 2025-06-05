<template>
  <v-dialog
    v-model="isOpen"
    :max-width="dialogMaxWidth"
    scrollable
    persistent
  >
    <LoaderCard v-if="loading" />

    <v-card v-else-if="errorMessage">
      <v-empty-state
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
    </v-card>

    <RepositoryAliasTemplateForm
      v-else
      :model-value="item"
      @update:model-value="onSave($event)"
    >
      <template #actions>
        <v-btn
          :text="$t('cancel')"
          variant="text"
          @click="isOpen = false"
        />
      </template>
    </RepositoryAliasTemplateForm>
  </v-dialog>
</template>

<script setup>
const emit = defineEmits({
  submit: (item) => !!item,
});

const { t } = useI18n();

const isOpen = ref(false);
const itemId = ref(null);

const {
  data: item,
  status,
  error,
  refresh,
  clear,
} = useFetch(() => `/api/repository-alias-templates/${itemId.value}`, {
  lazy: true,
  immediate: false,
  watch: false,
  query: {
    include: 'repository',
  },
});

const loading = computed(() => status.value === 'pending');
const errorMessage = computed(() => error.value && (error.value?.data?.error || t('anErrorOccurred')));
const errorIcon = computed(() => (error.value?.statusCode === 404 ? 'mdi-file-hidden' : 'mdi-alert-circle'));

const dialogMaxWidth = computed(() => {
  if (loading.value) { return 200; }
  if (errorMessage.value) { return 500; }
  return 700;
});

async function refreshForm() {
  if (itemId.value) {
    await refresh();
  }
}

async function open(id) {
  clear();
  itemId.value = id;
  isOpen.value = true;
  await refreshForm();
}

function onSave(institution) {
  emit('submit', institution);
  isOpen.value = false;
}

defineExpose({
  open,
});
</script>

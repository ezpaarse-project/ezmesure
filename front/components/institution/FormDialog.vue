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

    <InstitutionForm
      v-else
      ref="institutionFormRef"
      show-institution
      @submit="onSave($event)"
    >
      <template #actions>
        <v-btn
          :text="$t('cancel')"
          variant="text"
          @click="isOpen = false"
        />
      </template>
    </InstitutionForm>
  </v-dialog>
</template>

<script setup>
const emit = defineEmits({
  submit: (item) => !!item,
});

const { t } = useI18n();

const isOpen = ref(false);
const institutionId = ref(null);
const institutionFormRef = useTemplateRef('institutionFormRef');
const formOptions = ref(null);

const {
  data: institutionData,
  status,
  error,
  refresh,
  clear,
} = useFetch(() => `/api/institutions/${institutionId.value}`, {
  lazy: true,
  immediate: false,
  watch: false,
  query: { include: 'customProps.field' },
});

const loading = computed(() => status.value === 'pending');
const errorMessage = computed(() => error.value && (error.value?.data?.error || t('anErrorOccurred')));
const errorIcon = computed(() => (error.value?.statusCode === 404 ? 'mdi-file-hidden' : 'mdi-alert-circle'));

const dialogMaxWidth = computed(() => {
  if (loading.value) { return 200; }
  if (errorMessage.value) { return 500; }
  return 900;
});

async function refreshForm() {
  if (institutionId.value) {
    await refresh();
  }

  institutionFormRef.value?.init(institutionData.value, formOptions.value);
}

async function open(institution, opts) {
  clear();
  institutionId.value = institution?.id;
  formOptions.value = opts;
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

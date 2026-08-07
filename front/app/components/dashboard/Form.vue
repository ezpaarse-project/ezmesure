<template>
  <v-card
    :title="isEditing ? $t('dashboards.updateDashboard') : $t('dashboards.newDashboard')"
    prepend-icon="mdi-view-dashboard-edit"
  >
    <template #text>
      <v-form
        id="dashboardForm"
        v-model="valid"
        @submit.prevent="save()"
      >
        <SpaceAutoComplete
          v-model="dashboard.sourceSpaceId"
          :label="$t('dashboards.sourceSpace')"
          :return-object="false"
          :rules="[]"
          prepend-icon="mdi-form-textbox"
          variant="underlined"
          @update:model-value="dashboard.sourceDashboardId = undefined"
        />

        <DashboardKibanaAutocomplete
          v-model="dashboard.sourceDashboardId"
          :disabled="!dashboard.sourceSpaceId"
          :label="$t('dashboards.sourceDashboardId')"
          :rules="[v => !!v || $t('fieldIsRequired')]"
          :return-object="false"
          :space-id="dashboard.sourceSpaceId"
          prepend-icon="mdi-form-textbox"
          variant="underlined"
        />
      </v-form>
    </template>

    <template #actions>
      <v-spacer />

      <slot name="actions" :loading="saving" />

      <v-btn
        :text="!isEditing ? $t('add') : $t('save')"
        :prepend-icon="!isEditing ? 'mdi-plus' : 'mdi-content-save'"
        :disabled="!valid"
        :loading="saving"
        type="submit"
        form="dashboardForm"
        variant="elevated"
        color="primary"
      />
    </template>
  </v-card>
</template>

<script setup>
const emit = defineEmits({
  submit: (item) => !!item,
});

const initialData = defineModel({ type: Object });

const { t } = useI18n();
const snacks = useSnacksStore();

const saving = shallowRef(false);
const valid = shallowRef(false);

const dashboard = ref({
  id: initialData.value?.id,
  sourceSpaceId: initialData.value?.sourceSpaceId,
  sourceDashboardId: initialData.value?.sourceDashboardId,
});

const isEditing = computed(() => !!initialData.value?.id);

async function save() {
  saving.value = true;

  const dashboardId = initialData.value?.id;

  const url = dashboardId ? `/api/dashboard-templates/${dashboardId}` : '/api/dashboard-templates';
  const method = dashboardId ? 'PATCH' : 'POST';

  try {
    const newDashboard = await $fetch(url, {
      method,
      body: { ...dashboard.value },
    });
    emit('submit', newDashboard);
  } catch (err) {
    snacks.error(t('anErrorOccurred'), err);
  }

  saving.value = false;
}
</script>

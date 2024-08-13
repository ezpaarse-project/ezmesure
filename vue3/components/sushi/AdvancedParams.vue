<template>
  <div>
    <p>
      {{ $t('institutions.sushi.pleaseEnterParams') }}
    </p>

    <v-btn
      :text="$t('add')"
      prepend-icon="mdi-plus"
      color="primary"
      variant="outlined"
      size="small"
      class="mt-2"
      @click="addParam()"
    />

    <v-card
      v-for="({ param, readonly }, index) in params"
      :key="index"
      class="my-2"
    >
      <template #text>
        <v-row v-if="readonly">
          <v-col>
            <v-alert
              :text="$t('sushi.unchangeableParam')"
              type="info"
              density="compact"
              variant="outlined"
            />
          </v-col>
        </v-row>

        <v-row>
          <v-col cols="12">
            <v-select
              :model-value="param.scope"
              :label="$t('sushi.scope')"
              :items="scopes"
              :disabled="readonly"
              variant="outlined"
              density="compact"
              hide-details
              @update:model-value="patchParam(index, { scope: $event })"
            />
          </v-col>
          <v-col cols="6">
            <v-text-field
              :model-value="param.name"
              :label="$t('name')"
              :disabled="readonly"
              variant="outlined"
              density="compact"
              hide-details
              @update:model-value="patchParam(index, { name: $event })"
            />
          </v-col>
          <v-col cols="6">
            <v-text-field
              :model-value="param.value"
              :label="$t('value')"
              :disabled="readonly"
              variant="outlined"
              density="compact"
              hide-details
              @update:model-value="patchParam(index, { value: $event })"
            />
          </v-col>
        </v-row>
      </template>

      <template v-if="!readonly" #actions>
        <v-spacer />

        <v-btn
          :text="$t('delete')"
          prepend-icon="mdi-delete"
          color="red"
          size="small"
          @click="removeParam(index)"
        />
      </template>
    </v-card>
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: Array,
    default: () => [],
  },
  parentParams: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits({
  'update:modelValue': (v) => Array.isArray(v),
});

const { t } = useI18n();

const params = computed(() => [
  ...props.modelValue.map((param) => ({ param, readonly: false })),
  ...props.parentParams.map((param) => ({ param, readonly: true })),
]);

const scopes = computed(() => [
  { title: t('sushi.paramScopes.all'), value: 'all' },
  { title: t('sushi.paramScopes.report_list'), value: 'report_list' },
  { title: t('sushi.paramScopes.report_download'), value: 'report_download' },
  { title: t('sushi.paramScopes.report_download_tr'), value: 'report_download_tr' },
  { title: t('sushi.paramScopes.report_download_pr'), value: 'report_download_pr' },
  { title: t('sushi.paramScopes.report_download_dr'), value: 'report_download_dr' },
  { title: t('sushi.paramScopes.report_download_ir'), value: 'report_download_ir' },
]);

function addParam() {
  emit('update:modelValue', [{ scope: 'all' }, ...props.modelValue]);
}

function patchParam(index, data) {
  const param = params.value[index];
  if (!param) {
    return;
  }

  const currParams = [...props.modelValue];
  currParams[index] = { ...currParams[index], ...data };
  emit('update:modelValue', currParams);
}

function removeParam(index) {
  const currParams = [...props.modelValue];
  currParams.splice(index, 1);
  emit('update:modelValue', currParams);
}
</script>

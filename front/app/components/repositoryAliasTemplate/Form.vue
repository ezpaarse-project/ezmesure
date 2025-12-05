<template>
  <v-card
    :loading="loading && 'primary'"
    :title="$t(isEditing ? 'repoAliasTemplates.modifyTemplate' : 'repoAliasTemplates.newTemplate')"
    prepend-icon="mdi-eye-plus"
  >
    <template #append>
      <v-switch
        :model-value="template.active"
        :label="template.active ? $t('active') : $t('inactive')"
        color="primary"
        hide-details
        @update:model-value="template.active = $event"
      />
    </template>

    <template #text>
      <v-row>
        <v-col>
          <v-form
            id="aliasTemplateForm"
            ref="formRef"
            v-model="valid"
            @submit.prevent="save()"
          >
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="template.id"
                  :label="`${$t('identifier')} *`"
                  :disabled="isEditing"
                  :rules="[
                    v => !!v || $t('fieldIsRequired'),
                    v => /^[a-z0-9_-]+$/i.test(v) || $t('invalidFormat'),
                  ]"
                  prepend-icon="mdi-form-textbox"
                  variant="underlined"
                  hide-details="auto"
                  required
                />
              </v-col>

              <v-col cols="12">
                <v-text-field
                  v-model="template.pattern"
                  :label="`${$t('repoAliasTemplates.aliasesPattern')} *`"
                  :rules="[
                    v => !!v || $t('fieldIsRequired'),
                    v => /^[a-z0-9_-]+$/i.test(v?.replace(/{{.+?}}/g), 'abc') || $t('invalidFormat'),
                  ]"
                  prepend-icon="mdi-form-textbox"
                  variant="underlined"
                  hide-details="auto"
                  required
                />
              </v-col>

              <v-col cols="12">
                <RepositoryAutoComplete
                  :label="`${$t('repoAliasTemplates.target')} *`"
                  prepend-icon="mdi-database"
                  :model-value="repository"
                  @update:model-value="applyRepository($event)"
                />
              </v-col>
            </v-row>

            <v-row>
              <v-col>
                <FiltersForm
                  v-model="template.conditions"
                  :title="$t('repoAliasTemplates.conditions')"
                  :subtitle="$t('repoAliasTemplates.conditionsDescription')"
                  variant="outlined"
                  prepend-icon="mdi-format-list-checks"
                  disable-advanced
                />
              </v-col>
            </v-row>

            <v-row>
              <v-col>
                <FiltersForm
                  v-model="template.filters"
                  :title="$t('repoAliasTemplates.filters')"
                  variant="outlined"
                />
              </v-col>
            </v-row>
          </v-form>
        </v-col>
      </v-row>
    </template>

    <template #actions>
      <v-spacer />

      <slot name="actions" />

      <v-btn
        :text="isEditing ? $t('save') : $t('create')"
        :prepend-icon="isEditing ? 'mdi-content-save' : 'mdi-plus'"
        :disabled="!valid"
        :loading="loading"
        type="submit"
        form="aliasTemplateForm"
        variant="elevated"
        color="primary"
      />
    </template>
  </v-card>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: Object,
    default: () => undefined,
  },
});

const emit = defineEmits({
  'update:modelValue': (item) => !!item,
});

const { t } = useI18n();
const snacks = useSnacksStore();

const loading = shallowRef(false);
const valid = shallowRef(false);
const template = ref({});
const repository = ref({});

const isEditing = computed(() => !!props.modelValue?.id);

/** @type {Ref<Object | null>} */
const formRef = useTemplateRef('formRef');

function applyRepository(item) {
  if (!item || typeof item === 'string') {
    repository.value.pattern = item;
  } else {
    repository.value = item;
    formRef.value?.validate();
  }
}

watch(
  () => props.modelValue,
  () => {
    template.value = JSON.parse(JSON.stringify(props.modelValue || { active: true }));
    applyRepository(template.value?.repository);
  },
  { immediate: true },
);

async function save() {
  loading.value = true;

  try {
    const newTemplate = await $fetch(`/api/repository-alias-templates/${props.modelValue?.id || template.value.id}`, {
      method: 'PUT',
      body: {
        ...template.value,
        target: repository.value.pattern,
      },
    });

    emit('update:modelValue', newTemplate);
  } catch (err) {
    snacks.error(t('anErrorOccurred'), err);
  }

  loading.value = false;
}

onMounted(() => {
  formRef.value?.validate();
});
</script>

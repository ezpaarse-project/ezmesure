<template>
  <v-card
    :loading="loading && 'primary'"
    :title="isEditing ? $t('spaces.editSpace') : $t('spaces.newSpace')"
    prepend-icon="mdi-tab-plus"
  >
    <template v-if="showSpace" #subtitle>
      <SpaceSubtitle :model-value="modelValue" />
    </template>

    <template #text>
      <v-row>
        <v-col>
          <v-form
            id="spaceForm"
            ref="formRef"
            v-model="valid"
            @submit.prevent="save()"
          >
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="space.id"
                  :placeholder="institution.namespace"
                  :label="`${$t('spaces.id')} *`"
                  :rules="[
                    v => !!v || $t('fieldIsRequired'),
                    v => /^[a-z0-9*_-]+$/i.test(v) || $t('invalidFormat'),
                  ]"
                  prepend-icon="mdi-identifier"
                  variant="underlined"
                  hide-details="auto"
                  required
                  @update:model-value="applyPreset()"
                />
              </v-col>

              <v-col cols="12">
                <v-select
                  v-model="space.type"
                  :label="`${$t('spaces.type')} *`"
                  :items="types"
                  :rules="[
                    v => !!v || $t('fieldIsRequired'),
                  ]"
                  prepend-icon="mdi-tag"
                  variant="underlined"
                  hide-details="auto"
                  required
                  @update:model-value="applyPreset()"
                />
              </v-col>

              <v-col cols="12">
                <v-text-field
                  v-model="space.name"
                  :label="`${$t('name')} *`"
                  :rules="[
                    v => !!v || $t('fieldIsRequired'),
                  ]"
                  prepend-icon="mdi-form-textbox"
                  variant="underlined"
                  hide-details="auto"
                  required
                />
              </v-col>

              <v-col cols="12">
                <v-textarea
                  v-model="space.description"
                  :label="$t('description')"
                  prepend-icon="mdi-image-text"
                  variant="underlined"
                  hide-details="auto"
                  required
                />
              </v-col>
            </v-row>
          </v-form>
        </v-col>

        <v-col cols="12" lg="7">
          <PermissionManager v-model="permissions" :institution="institution" />
        </v-col>
      </v-row>
    </template>

    <template #actions>
      <v-spacer />

      <slot name="actions" />

      <v-btn
        :text="!isEditing ? $t('add') : $t('save')"
        :prepend-icon="!isEditing ? 'mdi-plus' : 'mdi-content-save'"
        :disabled="!valid"
        :loading="loading"
        type="submit"
        form="spaceForm"
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
  institution: {
    type: Object,
    required: true,
  },
  showSpace: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits({
  submit: (item) => !!item,
});

const { t, te } = useI18n();
const snacks = useSnacksStore();

const loading = ref(false);
const valid = ref(false);
const space = ref({ ...(props.modelValue ?? {}) });

const types = computed(() => {
  const keys = Array.from(repoColors.keys());
  return keys.map((type) => ({
    value: type,
    title: t(`spaces.types.${type}`),
  }));
});

/** @type {Ref<Object | null>} */
const formRef = useTemplateRef('formRef');

const { data: permissions } = await useAsyncData(
  `/api/kibana-spaces/${props.modelValue?.id || '-'}/permissions`,
  async () => {
    const perms = new Map();
    if (!props.modelValue?.id) {
      return perms;
    }

    const data = await $fetch(`/api/kibana-spaces/${props.modelValue.id}/permissions`, {
      query: {
        size: 0,
      },
    });
    // eslint-disable-next-line no-restricted-syntax
    for (const permission of data ?? []) {
      perms.set(permission.username, permission.readonly ? 'read' : 'write');
    }
    return perms;
  },
  {
    lazy: true,
  },
);

const isEditing = computed(() => !!props.modelValue?.id);

function applyPreset() {
  const spaceDesc = te(`spaces.descriptions.${space.value.type}`) ? t(`spaces.descriptions.${space.value.type}`) : space.value.type;
  space.value.name = `${props.institution.name} (${space.value.type})`;
  space.value.description = `${spaceDesc} (id: ${space.value.id})`;
}

async function save() {
  loading.value = true;

  try {
    const newSpace = await $fetch(isEditing.value ? `/api/kibana-spaces/${space.value.id}` : '/api/kibana-spaces', {
      method: isEditing.value ? 'PATCH' : 'POST',
      body: {
        id: space.value.id,
        type: space.value.type,
        name: space.value.name,
        description: space.value.description,
        institutionId: props.institution.id,
      },
    });

    await $fetch(`/api/kibana-spaces/${space.value.id}/permissions`, {
      method: 'PUT',
      body: Array.from(permissions.value.entries()).map(([username, permission]) => ({
        username,
        readonly: permission === 'read',
        locked: false,
      })),
    });

    emit('submit', newSpace);
  } catch {
    snacks.error(t('anErrorOccurred'));
  }

  loading.value = false;
}

onMounted(() => {
  formRef.value?.validate();
});
</script>

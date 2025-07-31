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

              <v-col cols="12">
                <v-input
                  :error-messages="logoErrorMessage"
                  prepend-icon="mdi-image"
                  hide-details="auto"
                >
                  <v-card
                    :title="$t('spaces.logo')"
                    variant="outlined"
                    class="w-100"
                    @dragover.prevent="isDraggingLogo = true"
                    @dragleave.prevent="isDraggingLogo = false"
                    @drop.prevent="onLogoDrop($event)"
                  >
                    <div class="d-flex justify-center">
                      <v-avatar
                        rounded
                        size="64"
                      >
                        <v-img v-if="logoSrc" :src="logoSrc" />
                        <v-icon v-else size="64" icon="mdi-image-off-outline" />
                      </v-avatar>
                    </div>

                    <template #actions>
                      <v-spacer />
                      <v-btn
                        v-if="logoPreview || space.imageUrl"
                        size="small"
                        variant="tonal"
                        color="red"
                        prepend-icon="mdi-delete"
                        :text="$t('delete')"
                        @click="removeLogo()"
                      />
                      <v-btn
                        size="small"
                        variant="tonal"
                        color="primary"
                        prepend-icon="mdi-pencil"
                        :text="$t('modify')"
                        @click="openFileDialog()"
                      />
                      <v-spacer />
                    </template>

                    <v-overlay
                      :model-value="isDraggingLogo"
                      class="align-center justify-center"
                      style="top: 0"
                      contained
                    >
                      {{ $t('images.dropImageHere') }}
                    </v-overlay>
                  </v-card>
                </v-input>
              </v-col>

              <v-col cols="12">
                <v-input
                  prepend-icon="mdi-shape"
                  hide-details="auto"
                >
                  <v-card
                    variant="outlined"
                    class="w-100"
                    :title="$t('spaces.featureVisibility')"
                  >
                    <SpaceFeaturesSelector v-model="space.disabledFeatures" />
                  </v-card>
                </v-input>
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
import prettySize from 'pretty-bytes';
import { fileToBase64 } from '@/lib/base64';

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

const LOGO_ACCEPT = 'JPEG, PNG, SVG';
const LOGO_MAX_SIZE = 2 * 1024 * 1024; // 2mb

const { open: openFileDialog, onChange: onFilesChange } = useFileDialog({
  accept: 'image/png, image/jpeg, image/svg+xml',
  reset: true,
  multiple: false,
});

const loading = shallowRef(false);
const valid = shallowRef(false);
const space = ref({ ...(props.modelValue ?? {}) });

const logoPreview = shallowRef('');
const logoErrorMessage = shallowRef('');
const isDraggingLogo = shallowRef(false);
const logoSrc = computed(() => logoPreview.value || space.value.imageUrl);

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
        disabledFeatures: space.value.disabledFeatures,
        institutionId: props.institution.id,
        imageUrl: logoPreview.value ? space.value.imageUrl : undefined,
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
  } catch (err) {
    snacks.error(t('anErrorOccurred'), err);
  }

  loading.value = false;
}

/**
 * Update the institution's logo
 *
 * @param {File} file Logo's file
 */
async function updateLogo(file) {
  if (!/\.(jpe?g|png|svg)$/.exec(file.name)) {
    logoErrorMessage.value = t('images.invalidImageFile', { accept: LOGO_ACCEPT });
    return;
  }

  if (file.size > LOGO_MAX_SIZE) {
    logoErrorMessage.value = t('images.imageTooLarge', { size: prettySize(LOGO_MAX_SIZE) });
    return;
  }

  logoErrorMessage.value = null;
  space.value.imageUrl = await fileToBase64(file);
  logoPreview.value = URL.createObjectURL(file);
}

/**
 * Update the space logo on drop
 *
 * @param {DragEvent} event
 */
function onLogoDrop(event) {
  const [file] = event?.dataTransfer?.files ?? [];
  if (file) {
    updateLogo(file);
  }
  isDraggingLogo.value = false;
}

/**
 * Remove the space logo
 */
function removeLogo() {
  logoErrorMessage.value = null;
  logoPreview.value = null;
  space.value.imageUrl = null;
}

/**
 * Update the space logo on file dialog change
 */
onFilesChange((files) => {
  const [file] = files ?? [];
  if (file) {
    updateLogo(file);
  }
});

onMounted(() => {
  formRef.value?.validate();
});
</script>

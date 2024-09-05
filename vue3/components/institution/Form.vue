<template>
  <v-card
    :loading="loading"
    :title="isEditing ? $t('institutions.updateInstitution') : $t('institutions.newInstitution')"
    :subtitle="showInstitution ? originalName : undefined"
    prepend-icon="mdi-office-building-plus"
  >
    <template #text>
      <v-row>
        <v-col>
          <OpenDataSearch
            v-model="openData"
            @update:model-value="applyOpenData()"
          />
        </v-col>
      </v-row>

      <v-row>
        <v-col>
          <v-form
            id="institutionForm"
            ref="formRef"
            v-model="valid"
            @submit.prevent="save()"
          >
            <v-card
              :title="$t('institutions.institution.general')"
              prepend-icon="mdi-format-list-bulleted"
              variant="outlined"
            >
              <template #text>
                <v-row>
                  <v-col cols="12" sm="6">
                    <v-text-field
                      v-model="institution.name"
                      :label="`${$t('name')} *`"
                      :rules="[v => !!v || $t('fieldIsRequired')]"
                      prepend-icon="mdi-rename"
                      variant="underlined"
                      hide-details="auto"
                      required
                    />
                  </v-col>

                  <v-col cols="12" sm="6">
                    <v-text-field
                      v-model="institution.acronym"
                      :label="$t('institutions.institution.acronym')"
                      prepend-icon="mdi-alphabetical-variant"
                      variant="underlined"
                      hide-details
                    />
                  </v-col>

                  <v-col cols="12" sm="6">
                    <v-text-field
                      v-model="institution.websiteUrl"
                      :label="$t('institutions.institution.homepage')"
                      prepend-icon="mdi-web"
                      variant="underlined"
                      hide-details
                    />
                  </v-col>

                  <v-col cols="12" sm="6">
                    <v-text-field
                      v-model="institution.city"
                      :label="$t('institutions.institution.city')"
                      prepend-icon="mdi-city-variant"
                      variant="underlined"
                      hide-details
                    />
                  </v-col>

                  <v-col cols="12" sm="6">
                    <v-text-field
                      v-model="institution.type"
                      :label="$t('institutions.institution.type')"
                      prepend-icon="mdi-tag"
                      variant="underlined"
                      hide-details
                    />
                  </v-col>

                  <v-col cols="12" sm="6">
                    <v-text-field
                      v-model="institution.uai"
                      :label="$t('institutions.institution.uai')"
                      :hint="$t('institutions.institution.uaiDescription')"
                      prepend-icon="mdi-identifier"
                      variant="underlined"
                      hide-details
                    />
                  </v-col>
                </v-row>
              </template>
            </v-card>

            <v-card
              :title="$t('institutions.institution.socialNetworks')"
              prepend-icon="mdi-account-network"
              variant="outlined"
              class="mt-4"
            >
              <template #text>
                <v-row>
                  <v-col cols="12" sm="6">
                    <v-text-field
                      v-model="institution.social.twitterUrl"
                      :label="$t('institutions.institution.twitterUrl')"
                      prepend-icon="mdi-twitter"
                      variant="underlined"
                      hide-details
                    />
                  </v-col>

                  <v-col cols="12" sm="6">
                    <v-text-field
                      v-model="institution.social.linkedinUrl"
                      :label="$t('institutions.institution.linkedinUrl')"
                      prepend-icon="mdi-linkedin"
                      variant="underlined"
                      hide-details
                    />
                  </v-col>

                  <v-col cols="12" sm="6">
                    <v-text-field
                      v-model="institution.social.youtubeUrl"
                      :label="$t('institutions.institution.youtubeUrl')"
                      prepend-icon="mdi-youtube"
                      variant="underlined"
                      hide-details
                    />
                  </v-col>

                  <v-col cols="12" sm="6">
                    <v-text-field
                      v-model="institution.social.facebookUrl"
                      :label="$t('institutions.institution.facebookUrl')"
                      prepend-icon="mdi-facebook"
                      variant="underlined"
                      hide-details
                    />
                  </v-col>
                </v-row>
              </template>
            </v-card>

            <v-card
              :title="$t('institutions.institution.logo')"
              :subtitle="$t('institutions.institution.logoHint', LOGO_RATIO)"
              prepend-icon="mdi-image"
              variant="outlined"
              class="mt-4"
              @dragover.prevent="isDraggingLogo = true"
              @dragleave.prevent="isDraggingLogo = false"
              @drop.prevent="onLogoDrop($event)"
            >
              <template #append>
                <v-btn
                  v-if="logoPreview || institution.logoId"
                  v-tooltip="$t('delete')"
                  icon="mdi-delete"
                  size="small"
                  variant="tonal"
                  color="red"
                  class="mr-2"
                  @click="removeLogo()"
                />
                <v-btn
                  v-tooltip="$t('modify')"
                  icon="mdi-pencil"
                  size="small"
                  variant="tonal"
                  color="primary"
                  @click="openFileDialog()"
                />
              </template>

              <template #text>
                <v-row v-if="logoError">
                  <v-col>
                    <v-alert
                      :text="logoError"
                      type="error"
                      closable
                      @click:close="logoError = null"
                    />
                  </v-col>
                </v-row>

                <v-row>
                  <v-col>
                    <v-img
                      :src="logoSrc"
                      max-width="500"
                      class="mx-auto"
                      :style="{
                        aspectRatio: `${LOGO_RATIO[0]}/${LOGO_RATIO[1]}`,
                      }"
                    />
                  </v-col>
                </v-row>
              </template>

              <v-overlay
                :model-value="isDraggingLogo"
                scrim="primary"
                class="drop-files-here"
                contained
              >
                {{ $t('institutions.institution.dropImageHere') }}
              </v-overlay>
            </v-card>

            <v-card
              v-if="user?.isAdmin"
              :title="$t('administration')"
              prepend-icon="mdi-security"
              variant="outlined"
              class="mt-4"
            >
              <template #text>
                <v-row>
                  <v-col cols="12">
                    <v-text-field
                      v-model="institution.namespace"
                      :label="$t('institutions.institution.namespace')"
                      :hint="$t('institutions.institution.namespaceHint')"
                      :rules="namespaceRules"
                      prepend-icon="mdi-backspace"
                      variant="underlined"
                      density="compact"
                      persistent-hint
                    />
                  </v-col>

                  <v-col cols="12" sm="6">
                    <v-checkbox
                      v-model="institution.validated"
                      :label="$t('institutions.institution.valid')"
                      density="compact"
                      color="primary"
                      hide-details
                    />
                  </v-col>

                  <v-col cols="12" sm="6">
                    <v-checkbox
                      v-model="institution.hidePartner"
                      :label="$t('institutions.institution.hidePartner')"
                      density="compact"
                      color="primary"
                      hide-details
                    />
                  </v-col>
                </v-row>
              </template>
            </v-card>
          </v-form>
        </v-col>
      </v-row>
    </template>

    <template #actions>
      <v-spacer />

      <slot name="actions" />

      <v-btn
        :text="isEditing ? $t('update') : $t('create')"
        :disabled="!valid"
        :loading="loading"
        prepend-icon="mdi-content-save"
        type="submit"
        form="institutionForm"
        variant="elevated"
        color="primary"
      />
    </template>
  </v-card>
</template>

<script setup>
import { fileToBase64 } from '@/lib/base64';
import defaultLogo from '@/static/images/logo-etab.png';

defineProps({
  showInstitution: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits({
  submit: (item) => !!item,
});

const ID_PATTERN = /^[a-z0-9][a-z0-9_.-]*$/;
const LOGO_RATIO = [3, 1];
const LOGO_MAX_SIZE = 2 * 1024 * 1024; // 2mb

const { t } = useI18n();
const { data: user } = useAuthState();
const snacks = useSnacksStore();
const { open: openFileDialog, onChange: onFilesChange } = useFileDialog({
  accept: 'image/png, image/jpeg, image/svg+xml',
});

const namespaceRules = [
  (v) => (!v || ID_PATTERN.test(v)) || t('fieldMustMatch', { pattern: ID_PATTERN.toString() }),
];

const loading = ref(false);
const valid = ref(false);
const originalName = ref(undefined);
/** @type {Ref<Object>} */
const institution = ref({ social: {} });
const logoPreview = ref('');
const logoError = ref('');
const isDraggingLogo = ref(false);
/** @type {Ref<Object | null>} */
const openData = ref(null);
const addAsMember = ref(false);

/** @type {Ref<Object | null>} */
const formRef = ref(null);

const isEditing = computed(() => !!institution.value.id);
const logoSrc = computed(() => {
  if (logoPreview.value) { return logoPreview.value; }
  if (institution.value.logoId) { return `/api/assets/logos/${institution.value.logoId}`; }
  return defaultLogo;
});

/**
 * Init the form, if `institution` is provided, pre-populate the form and will
 * update it.
 *
 * @param {Object} [item]
 * @param {Object} [opts]
 * @param {boolean} [opts.addAsMember]
 */
function init(item, opts) {
  originalName.value = item?.name;
  institution.value = {
    social: {},
    ...(item ?? {}),
  };
  logoPreview.value = null;
  logoError.value = null;
  openData.value = null;

  if (!item) {
    addAsMember.value = opts?.addAsMember !== false;
  }

  if (formRef.value) {
    formRef.value?.validate();
  }
}

/**
 * Apply the open data to the institution.
 */
function applyOpenData() {
  if (!openData.value) {
    return;
  }

  const od = openData.value;

  institution.value = {
    ...institution.value,
    name: od.uo_lib_officiel || od.uo_lib || '',
    websiteUrl: od.url || '',
    uai: od.uai || '',
    type: od.type_d_etablissement || '',
    city: od.com_nom || '',
    acronym: od.sigle || '',
    social: {
      ...institution.value.social,
      twitterUrl: od.compte_twitter || '',
      linkedinUrl: od.compte_linkedin || '',
      youtubeUrl: od.compte_youtube || '',
      facebookUrl: od.compte_facebook || '',
    },
  };
}

/**
 * Save the institution.
 */
async function save() {
  loading.value = true;

  try {
    if (isEditing.value) {
      await $fetch(`/api/institutions/${institution.value.id}`, {
        method: 'PUT',
        body: { ...institution.value },
      });
    } else {
      await $fetch('/api/institutions', {
        method: 'POST',
        body: { ...institution.value },
        query: { addAsMember: addAsMember.value },
      });
    }
  } catch (err) {
    if (!(err instanceof Error)) {
      snacks.error(t('institutions.institution.unableToUpate'));
      return;
    }

    if (err.statusCode === 413) {
      snacks.error(t('institutions.institution.imageTooLarge'));
    } else {
      snacks.error(err);
    }

    loading.value = false;
    return;
  }

  snacks.success(t('institutions.institution.updated'));
  loading.value = false;
  emit('submit', institution.value);
}

/**
 * Update the institution's logo
 *
 * @param {File} file Logo's file
 */
async function updateLogo(file) {
  if (!/\.(jpe?g|png|svg)$/.exec(file.name)) {
    logoError.value = this.$t('institutions.institution.invalidImageFile');
    return;
  }

  if (file.size > LOGO_MAX_SIZE) {
    logoError.value = this.$t('institutions.institution.imageTooLarge');
    return;
  }

  const base64logo = await fileToBase64(file);
  institution.value.logo = base64logo;
  logoPreview.value = URL.createObjectURL(file);
}

/**
 * Update the institution's logo on drop
 *
 * @param {DragEvent} event
 */
function onLogoDrop(event) {
  const f = event?.dataTransfer?.files;
  if (f?.[0]) {
    updateLogo(f[0]);
  }
  isDraggingLogo.value = false;
}

/**
 * Remove the institution's logo
 */
async function removeLogo() {
  logoPreview.value = null;
  institution.value.logo = null;
  institution.value.logoId = null;
}

/**
 * Update the institution's logo on file dialog change
 */
onFilesChange((files) => updateLogo(files[0]));

onMounted(() => {
  formRef.value?.validate();
});

defineExpose({
  init,
});
</script>

<style scoped lang="scss">
.drop-files-here {
  align-items: center;
  justify-content: center;
  top: 0 !important;
}
</style>

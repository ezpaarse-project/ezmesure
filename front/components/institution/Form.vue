<template>
  <v-card
    :loading="loading && 'primary'"
    :title="isEditing ? $t('institutions.updateInstitution') : $t('institutions.newInstitution')"
    :subtitle="showInstitution ? originalName : undefined"
    prepend-icon="mdi-office-building-plus"
  >
    <template #text>
      <v-row>
        <v-col>
          <InstitutionOpenDataSearch
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
              v-if="user?.isAdmin"
              :title="$t('institutions.institution.tags')"
              prepend-icon="mdi-tag-outline"
              variant="outlined"
              class="mt-4"
            >
              <template #text>
                <p class="mb-3">
                  {{ $t('institutions.institution.tagsDescription') }}
                </p>

                <v-combobox
                  v-model="institution.tags"
                  v-model:search="tagSearch"
                  v-model:focused="tagInputFocused"
                  :label="$t('institutions.institution.tags')"
                  :items="availableTags"
                  :loading="loadingTags && 'primary'"
                  :hide-no-data="!tagSearch"
                  prepend-icon="mdi-tag"
                  variant="underlined"
                  multiple
                  chips
                  closable-chips
                  hide-details
                >
                  <template #no-data>
                    <v-list-item>
                      <template #title>
                        <i18n-t keypath="noMatchFor">
                          <template #search>
                            <strong>{{ tagSearch }}</strong>
                          </template>

                          <template #key>
                            <kbd>{{ $t('enterKey') }}</kbd>
                          </template>
                        </i18n-t>
                      </template>
                    </v-list-item>
                  </template>
                </v-combobox>
              </template>
            </v-card>

            <v-card
              :title="$t('institutions.institution.customProperties')"
              prepend-icon="mdi-tag-text-outline"
              variant="outlined"
              class="mt-4"
            >
              <template v-if="user?.isAdmin" #append>
                <v-menu
                  v-model="showCustomPropMenu"
                  location="left center"
                  :offset="10"
                  :close-on-content-click="false"
                  width="250px"
                >
                  <template #activator="{ props: menu }">
                    <v-btn
                      v-tooltip="showCustomPropMenu ? $t('close') : $t('add')"
                      :icon="showCustomPropMenu ? 'mdi-close' : 'mdi-plus'"
                      variant="tonal"
                      :color="showCustomPropMenu ? undefined : 'green'"
                      density="comfortable"
                      v-bind="menu"
                    />
                  </template>

                  <v-autocomplete
                    ref="customPropInput"
                    v-model="customField"
                    :label="$t('institutions.institution.propertyName')"
                    :items="availableCustomFields ?? []"
                    item-title="labelFr"
                    variant="outlined"
                    density="compact"
                    class="flex-grow-1"
                    return-object
                    autofocus
                    hide-details
                    auto-select-first
                    @update:model-value="addCustomProp"
                  >
                    <template #item="{ props: itemProps, item }">
                      <v-list-item v-bind="itemProps" :subtitle="item.raw.id" />
                    </template>
                  </v-autocomplete>
                </v-menu>
              </template>

              <template #text>
                <v-alert
                  v-if="customFieldsError"
                  :title="$t('institutions.institution.failedToGetCustomProperties')"
                  :text="customFieldsError?.message"
                  type="error"
                />

                <v-empty-state
                  v-else-if="!hasCustomProps"
                  color="red"
                  :title="$t('institutions.institution.noCustomProps')"
                  :text="user?.isAdmin ? $t('institutions.institution.addNewCustomProp') : undefined"
                />

                <div
                  v-for="(customProp, index) in institution.customProps"
                  :key="customProp.fieldId"
                  class="d-flex align-center ga-2 pt-3"
                >
                  <div class="flex-grow-1">
                    <InstitutionCustomProp
                      :ref="(el) => customPropInputRefs[customProp.fieldId] = el"
                      v-model="institution.customProps[index]"
                      variant="outlined"
                      density="compact"
                      hide-details
                      :readonly="!user?.isAdmin && (customProp.field?.editable !== true)"
                    />
                  </div>

                  <div v-if="user?.isAdmin" class="flex-shrink-1">
                    <v-btn
                      icon="mdi-delete"
                      variant="text"
                      density="comfortable"
                      size="small"
                      color="red"
                      @click="removeCustomProp(customProp.fieldId)"
                    />
                  </div>
                </div>
              </template>
            </v-card>

            <v-card
              :title="$t('institutions.institution.logo')"
              :subtitle="$t('institutions.institution.logoHint', { ratioW: LOGO_RATIO.w, ratioH: LOGO_RATIO.h, accept: LOGO_ACCEPT })"
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
                  :text="$t('delete')"
                  prepend-icon="mdi-delete"
                  variant="tonal"
                  color="red"
                  class="mr-2"
                  @click="removeLogo()"
                />
                <v-btn
                  :text="$t('modify')"
                  prepend-icon="mdi-pencil"
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
                        aspectRatio: `${LOGO_RATIO.w}/${LOGO_RATIO.h}`,
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

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => undefined,
  },
  formOptions: {
    type: Object,
    default: () => undefined,
  },
  showInstitution: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits({
  submit: (item) => !!item,
});

const ID_PATTERN = /^[a-z0-9][a-z0-9_.-]*$/;
const LOGO_RATIO = { w: 3, h: 1 };
const LOGO_ACCEPT = 'JPEG, PNG, SVG';
const LOGO_MAX_SIZE = 2 * 1024 * 1024; // 2mb

const { t } = useI18n();
const { data: user } = useAuthState();
const snacks = useSnacksStore();
const { open: openFileDialog, onChange: onFilesChange } = useFileDialog({
  accept: 'image/png, image/jpeg, image/svg+xml',
  reset: true,
  multiple: false,
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
const showCustomPropMenu = ref(false);
const customField = ref(null);
const customPropInputRefs = ref({});

const loadingTags = ref(false);
const availableTags = ref([]);
const tagSearch = ref('');
const tagInputFocused = ref(false);

const {
  data: availableCustomFields,
  error: customFieldsError,
  execute: fetchCustomFields,
} = useFetch('/api/custom-fields', { // Don't await cause we need defineExpose
  lazy: true,
  immediate: false,
  dedupe: 'defer',
});

/** @type {Ref<Object | null>} */
const customPropInputRef = useTemplateRef('customPropInput');
/** @type {Ref<Object | null>} */
const formRef = useTemplateRef('formRef');

const hasCustomProps = computed(() => Object.keys(institution.value.customProps || {}).length > 0);

const isEditing = computed(() => !!institution.value.id);

const logoSrc = computed(() => {
  if (logoPreview.value) { return logoPreview.value; }
  if (institution.value.logoId) { return `/api/assets/logos/${institution.value.logoId}`; }
  return defaultLogo;
});

async function getAvailableTags() {
  loadingTags.value = true;

  try {
    const items = await $fetch('/api/institutions', {
      query: {
        size: 0,
        distinct: 'tags',
      },
    });

    // Merge all tags in one array then make unique
    const tags = new Set(items.flatMap((item) => item.tags ?? []));

    availableTags.value = Array.from(tags).toSorted((a, b) => (
      a.toLowerCase().localeCompare(b.toLowerCase())
    ));
  } catch (err) {
    snacks.error(t('anErrorOccurred'), err);
  } finally {
    loadingTags.value = false;
  }
}

watch(tagInputFocused, getAvailableTags, { once: true });

function removeCustomProp(fieldId) {
  institution.value.customProps = institution.value.customProps.filter(
    (prop) => prop.fieldId !== fieldId,
  );
}

function addCustomProp(field) {
  const customProps = institution.value.customProps ?? [];

  if (!customProps.find((prop) => prop.fieldId === field.id)) {
    customProps.push({
      field,
      fieldId: field.id,
      value: field.multiple ? [] : '',
    });

    institution.value.customProps = customProps;
  }

  showCustomPropMenu.value = false;
  nextTick(() => { customPropInputRefs.value[field.id]?.focus(); });
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
    if (err.statusCode === 413) {
      snacks.error(t('institutions.institution.imageTooLarge'));
    } else {
      snacks.error(t('institutions.institution.unableToUpate'), err);
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
    logoError.value = t('institutions.institution.invalidImageFile', { accept: LOGO_ACCEPT });
    return;
  }

  if (file.size > LOGO_MAX_SIZE) {
    logoError.value = t('institutions.institution.imageTooLarge');
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
  const [file] = event?.dataTransfer?.files ?? [];
  if (file) {
    updateLogo(file);
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
 * Init the form, if `institution` is provided, pre-populate the form and will
 * update it.
 */
watch(() => props.modelValue, () => {
  /**
   * @type {Object} [opts]
   * @property {boolean} [opts.addAsMember]
   */
  const opts = props.formOptions;

  originalName.value = props.modelValue?.name;
  institution.value = {
    social: {},
    customProps: [],
    ...(props.modelValue ?? {}),
  };
  logoPreview.value = null;
  logoError.value = null;
  openData.value = null;

  if (!props.modelValue) {
    addAsMember.value = opts?.addAsMember !== false;
  }

  if (formRef.value) {
    formRef.value.validate();
  }
}, { immediate: true });

watch(showCustomPropMenu, (v) => {
  if (!v) {
    return;
  }

  customField.value = null;
  nextTick(() => { customPropInputRef.value?.focus(); });

  if (!availableCustomFields.value) {
    fetchCustomFields();
  }
});

/**
 * Update the institution's logo on file dialog change
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

<style scoped lang="scss">
.drop-files-here {
  align-items: center;
  justify-content: center;
  top: 0 !important;
}
</style>

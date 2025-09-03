<template>
  <v-card
    :title="isEditing ? $t('roles.editRole') : $t('roles.newRole')"
    :prepend-icon="isEditing ? 'mdi-tag-edit' : 'mdi-tag-plus'"
  >
    <template #text>
      <v-form
        id="roleForm"
        ref="formRef"
        v-model="valid"
        @submit.prevent="save()"
      >
        <v-row>
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="role.id"
              :label="`${$t('identifier')} *`"
              :rules="idRules"
              prepend-icon="mdi-key-variant"
              variant="underlined"
              hide-details="auto"
            />
          </v-col>

          <v-col cols="12" sm="6">
            <v-text-field
              :model-value="role.icon"
              :label="$t('icon')"
              :prepend-icon="role.icon || 'mdi-tag-outline'"
              variant="underlined"
              hide-details="auto"
              clearable
              readonly
              @click:clear="role.icon = null"
            >
              <v-menu
                v-model="showIconMenu"
                activator="parent"
                :close-on-content-click="false"
              >
                <IconPicker
                  v-model="role.icon"
                  @update:model-value="showIconMenu = false"
                />
              </v-menu>
            </v-text-field>
          </v-col>

          <v-col cols="12">
            <v-text-field
              v-model="role.label"
              :label="$t('label')"
              prepend-icon="mdi-label-outline"
              variant="underlined"
              hide-details="auto"
            />
          </v-col>

          <v-col cols="12">
            <v-textarea
              v-model="role.description"
              :label="$t('description')"
              prepend-icon="mdi-book-open-page-variant"
              variant="underlined"
              hide-details
            />
          </v-col>

          <v-col cols="12">
            <v-checkbox
              v-model="role.restricted"
              :label="$t('roles.onlyAdmins')"
              density="compact"
              color="primary"
              prepend-icon="mdi-lock"
              hide-details
            />
            <v-checkbox
              :model-value="hasPresets"
              :label="$t('roles.definePermissionsPreset')"
              density="compact"
              color="primary"
              prepend-icon="mdi-shield"
              hide-details
              @update:model-value="$event => role.permissionsPreset = $event ? {} : null"
            />
          </v-col>

          <v-col cols="12">
            <v-slide-y-transition>
              <v-list v-if="hasPresets">
                <v-list-item
                  v-for="feature in features"
                  :key="feature.scope"
                  :title="feature.text"
                >
                  <template #append>
                    <PermissionSwitch
                      v-model="role.permissionsPreset[feature.scope]"
                      :icons="$vuetify.display.smAndDown"
                    />
                  </template>
                </v-list-item>
              </v-list>
            </v-slide-y-transition>
          </v-col>
        </v-row>
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
        form="roleForm"
        variant="elevated"
        color="primary"
      />
    </template>
  </v-card>
</template>

<script setup>
import { presetScopes } from '@/lib/permissions/utils';

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => undefined,
  },
});

const emit = defineEmits({
  submit: (item) => !!item,
  'update:modelValue': (item) => !!item,
});

const { t } = useI18n();
const snacks = useSnacksStore();

const ID_PATTERN = /^[a-z0-9_-]+$/i;

const idRules = [
  (v) => !!v || t('fieldIsRequired'),
  (v) => (!v || ID_PATTERN.test(v)) || t('fieldMustMatch', { pattern: ID_PATTERN.toString() }),
];

const showIconMenu = shallowRef(false);
const saving = shallowRef(false);
const valid = shallowRef(false);
const role = ref({
  ...(props.modelValue ?? {}),
  restricted: !!props.modelValue?.restricted,
  permissionsPreset: props.modelValue?.permissionsPreset || null,
});

const originalId = computed(() => props.modelValue?.id);
const isEditing = computed(() => !!originalId.value);

const hasPresets = computed(() => !!role.value.permissionsPreset);

/**
 * Available features
 */
const features = computed(() => presetScopes.map((scope) => ({
  scope,
  text: t(`institutions.members.featureLabels.${scope}`),
})));

async function save() {
  saving.value = true;

  try {
    const newRole = await $fetch(`/api/roles/${originalId.value || role.value.id}`, {
      method: 'PUT',
      body: { ...role.value },
    });
    emit('submit', newRole);
  } catch (err) {
    snacks.error(t('anErrorOccurred'), err);
  }

  saving.value = false;
}
</script>

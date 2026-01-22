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
              v-model="role.label"
              :label="`${$t('label')} *`"
              :rules="[(v) => !!v || t('fieldIsRequired')]"
              prepend-icon="mdi-label-outline"
              variant="underlined"
              hide-details="auto"
            />
          </v-col>

          <v-col cols="12" sm="6">
            <v-color-input
              v-model="role.color"
              :label="$t('color')"
              :modes="['hex']"
              :swatches="genericColorPalette"
              hide-details="auto"
              mode="hex"
              variant="underlined"
              color-pip
              clearable
              show-swatches
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
            <v-textarea
              v-model="role.description"
              :label="$t('description')"
              prepend-icon="mdi-book-open-page-variant"
              variant="underlined"
              hide-details
            />
          </v-col>

          <v-col cols="12">
            <v-input
              prepend-icon="mdi-bell"
              hide-details
            >
              <v-expansion-panels>
                <v-expansion-panel>
                  <template #title>
                    {{ $t('roles.notifyUserWhen') }}

                    <v-chip
                      :text="`${role.notifications?.length ?? 0} / ${availableNotifications.length}`"
                      size="x-small"
                      variant="outlined"
                      class="ml-1"
                    />
                  </template>

                  <template #text>
                    <v-list
                      v-model:selected="role.notifications"
                      select-strategy="leaf"
                      density="compact"
                      class="py-0"
                    >
                      <v-list-item
                        v-for="item in availableNotifications"
                        :key="item.id"
                        :title="item.text"
                        :value="item.id"
                      >
                        <template #prepend="{ isSelected, select }">
                          <v-list-item-action start>
                            <v-checkbox-btn
                              density="compact"
                              :model-value="isSelected"
                              @update:model-value="select"
                            />
                          </v-list-item-action>
                        </template>
                      </v-list-item>
                    </v-list>
                  </template>
                </v-expansion-panel>
              </v-expansion-panels>
            </v-input>
          </v-col>

          <v-col cols="12">
            <v-input
              prepend-icon="mdi-refresh-auto"
              hide-details
            >
              <v-expansion-panels>
                <v-expansion-panel>
                  <template #title>
                    {{ $t('roles.autoAssignWhen') }}

                    <v-chip
                      :text="`${role.autoAssign?.length ?? 0} / ${availableEvents.length}`"
                      size="x-small"
                      variant="outlined"
                      class="ml-1"
                    />
                  </template>

                  <template #text>
                    <v-list
                      v-model:selected="role.autoAssign"
                      select-strategy="leaf"
                      density="compact"
                      class="py-0"
                    >
                      <v-list-item
                        v-for="item in availableEvents"
                        :key="item.id"
                        :title="item.text"
                        :value="item.id"
                      >
                        <template #prepend="{ isSelected, select }">
                          <v-list-item-action start>
                            <v-checkbox-btn
                              density="compact"
                              :model-value="isSelected"
                              @update:model-value="select"
                            />
                          </v-list-item-action>
                        </template>
                      </v-list-item>
                    </v-list>
                  </template>
                </v-expansion-panel>
              </v-expansion-panels>
            </v-input>
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
              v-model="role.exposed"
              :label="$t('roles.exposeMembers')"
              density="compact"
              color="primary"
              prepend-icon="mdi-earth"
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

const emit = defineEmits({
  submit: (item) => !!item,
});

const model = defineModel({ type: Object, default: () => undefined });

const { t } = useI18n();
const snacks = useSnacksStore();

const ID_PATTERN = /^[a-z0-9_-]+$/i;

const idRules = computed(() => [
  (v) => !!v || t('fieldIsRequired'),
  (v) => (!v || ID_PATTERN.test(v)) || t('fieldMustMatch', { pattern: ID_PATTERN.toString() }),
]);

const showIconMenu = shallowRef(false);
const saving = shallowRef(false);
const valid = shallowRef(false);
const role = ref({
  ...model.value,
  restricted: !!model.value?.restricted,
  permissionsPreset: model.value?.permissionsPreset || null,
});

const originalId = computed(() => model.value?.id);
const isEditing = computed(() => !!originalId.value);

const hasPresets = computed(() => !!role.value.permissionsPreset);

const availableNotifications = computed(
  () => [
    'institution:validated',
    'institution:role_assigned',
    'institution:new_user_matching_institution',
    'institution:membership_request',
    'counter:new_data_available',
  ].map((id) => ({ id, text: t(`roles.notificationTypes.${id}`) })),
);

const availableEvents = computed(
  () => [
    'institution:self_join',
    'institution:user_onboarded',
    'institution:declared',
  ].map((id) => ({ id, text: t(`roles.eventTypes.${id}`) })),
);

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

<style lang="scss" scoped>
  :deep(.v-expansion-panel-text__wrapper) {
    padding: 0 !important;
  }
</style>

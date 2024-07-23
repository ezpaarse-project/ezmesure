<template>
  <v-dialog
    :model-value="isOpen"
    width="600"
    @update:model-value="close()"
  >
    <v-card :title="$t('components.components')">
      <template v-if="institution" #subtitle>
        {{ institution.pattern }}

        <v-chip
          :text="institution.type"
          :color="repoColors.get(institution.type)"
          size="x-small"
          density="comfortable"
          class="ml-2"
        />
      </template>

      <template #append>
        <v-menu
          v-model="isSearchOpen"
          :persistent="isLinkLoading"
          :close-on-content-click="false"
          width="300"
        >
          <template #activator="{ props }">
            <v-btn
              :text="$t('add')"
              prepend-icon="mdi-plus"
              variant="text"
              color="primary"
              v-bind="props"
            />
          </template>

          <v-card>
            <template #text>
              <InstitutionAutoComplete v-model="componentToLink" />
            </template>

            <template #actions>
              <v-spacer />

              <v-btn variant="text" @click="isSearchOpen = false">
                {{ $t('cancel') }}
              </v-btn>

              <v-btn
                color="primary"
                :loading="isLinkLoading"
                :disabled="!componentToLink"
                @click="linkComponent()"
              >
                {{ $t('add') }}
              </v-btn>
            </template>
          </v-card>
        </v-menu>
      </template>

      <template #text>
        <div v-if="components.length <= 0" class="text-center text-grey pt-5">
          {{ $t('repositories.noComponents') }}
        </div>

        <v-list v-else>
          <v-list-item
            v-for="component in components"
            :key="component.id"
            :to="`/admin/institutions/${component.id}`"
            :prepend-avatar="component.logoId ? `/api/assets/logos/${component.logoId}` : undefined"
            :prepend-icon="!component.logoId ? 'mdi-office-building' : undefined"
            :title="component.name"
            :subtitle="component.acronym"
          >
            <template #append>
              <ConfirmPopover
                :text="$t('areYouSure')"
                :agree-text="$t('delete')"
                :agree="() => unlinkComponent(component)"
                location="end"
              >
                <template #activator="{ props }">
                  <v-btn
                    icon="mdi-delete"
                    variant="tonal"
                    size="small"
                    density="comfortable"
                    color="error"
                    v-bind="props"
                    @click.prevent=""
                  />
                </template>
              </ConfirmPopover>
            </template>
          </v-list-item>
        </v-list>
      </template>

      <template #actions>
        <v-spacer />

        <v-btn
          text
          @click="close()"
        >
          {{ $t('close') }}
        </v-btn>
      </template>
    </v-card>
  </v-dialog>
</template>

<script setup>
const emit = defineEmits({
  'update:modelValue': (components) => !!components,
});

const { t } = useI18n();
const snacks = useSnacksStore();

const isOpen = ref(false);
const isSearchOpen = ref(false);
const isLinkLoading = ref(false);
const hasChanged = ref(false);
/** @type {Ref<object|null>} */
const institution = ref(null);
const components = ref([]);
/** @type {Ref<object|null>} */
const componentToLink = ref(null);

function open(items, i) {
  institution.value = i;
  components.value = items;
  isOpen.value = true;
  hasChanged.value = false;
}

function close() {
  if (hasChanged.value) {
    emit('update:modelValue', components.value);
  }
  isOpen.value = false;
}

async function unlinkComponent(item) {
  try {
    await $fetch(`/api/institutions/${institution.value.id}/subinstitutions/${item.id}`, {
      method: 'DELETE',
    });

    components.value = components.value.filter((i) => i.id !== item.id);

    hasChanged.value = true;
  } catch (err) {
    snacks.error(t('anErrorOccurred'));
  }
}

async function linkComponent() {
  if (!componentToLink.value || !institution.value) {
    return;
  }

  isLinkLoading.value = true;
  try {
    await $fetch(`/api/institutions/${institution.value.id}/subinstitutions/${componentToLink.value.id}/`, {
      method: 'PUT',
      body: { type: institution.value.type },
    });

    components.value.push(componentToLink.value);
    componentToLink.value = null;

    hasChanged.value = true;
    isSearchOpen.value = false;
  } catch (err) {
    snacks.error(t('anErrorOccurred'));
  }
  isLinkLoading.value = false;
}

defineExpose({
  open,
});
</script>

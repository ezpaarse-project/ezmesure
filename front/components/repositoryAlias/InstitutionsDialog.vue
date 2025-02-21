<template>
  <v-dialog
    :model-value="isOpen"
    width="600"
    @update:model-value="close()"
  >
    <v-card :title="$t('repositories.institutions')">
      <template v-if="alias" #subtitle>
        {{ alias.pattern }}

        <v-chip
          v-if="alias.repository"
          :text="alias.repository.type"
          :color="repoColors.get(alias.repository.type)"
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
              <InstitutionAutoComplete v-model="institutionToLink" />
            </template>

            <template #actions>
              <v-spacer />

              <v-btn variant="text" @click="isSearchOpen = false">
                {{ $t('cancel') }}
              </v-btn>

              <v-btn
                color="primary"
                :loading="isLinkLoading"
                :disabled="!institutionToLink"
                @click="linkInstitution()"
              >
                {{ $t('add') }}
              </v-btn>
            </template>
          </v-card>
        </v-menu>
      </template>

      <template #text>
        <div v-if="institutions.length <= 0" class="text-center text-grey pt-5">
          {{ $t('repositoryAliases.noInstitutions') }}
        </div>

        <v-list v-else density="compact">
          <v-list-item
            v-for="institution in sortedInstitutions"
            :key="institution.id"
            :to="`/admin/institutions/${institution.id}`"
            :title="institution.name"
            :subtitle="institution.acronym"
            lines="two"
          >
            <template #prepend>
              <InstitutionAvatar :institution="institution" />
            </template>

            <template #append>
              <ConfirmPopover
                :agree-text="$t('delete')"
                :agree="() => unlinkInstitution(institution)"
                location="end"
              >
                <template #activator="{ props }">
                  <v-btn
                    icon="mdi-delete"
                    variant="tonal"
                    size="small"
                    density="comfortable"
                    color="red"
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
  'update:modelValue': (institutions) => !!institutions,
});

const { t } = useI18n();
const snacks = useSnacksStore();

const isOpen = ref(false);
const isSearchOpen = ref(false);
const isLinkLoading = ref(false);
const hasChanged = ref(false);
/** @type {Ref<object|null>} */
const alias = ref(null);
const institutions = ref([]);
/** @type {Ref<object|null>} */
const institutionToLink = ref(null);

const sortedInstitutions = computed(
  () => institutions.value.toSorted((a, b) => a.name.localeCompare(b.name)),
);

function open(a) {
  alias.value = a;
  institutions.value = a.institutions;
  isOpen.value = true;
  hasChanged.value = false;
}

function close() {
  if (hasChanged.value) {
    emit('update:modelValue', institutions.value);
  }
  isOpen.value = false;
}

async function unlinkInstitution(item) {
  try {
    await $fetch(`/api/institutions/${item.id}/repository-aliases/${alias.value.pattern}`, {
      method: 'DELETE',
    });

    institutions.value = institutions.value.filter((i) => i.id !== item.id);

    hasChanged.value = true;
  } catch {
    snacks.error(t('anErrorOccurred'));
  }
}

async function linkInstitution() {
  if (!institutionToLink.value || !alias.value) {
    return;
  }

  isLinkLoading.value = true;
  try {
    await $fetch(`/api/institutions/${institutionToLink.value.id}/repository-aliases/${alias.value.pattern}`, {
      method: 'PUT',
      body: { target: alias.value.target, filters: alias.value.filters },
    });

    institutions.value.push(institutionToLink.value);
    institutionToLink.value = null;

    hasChanged.value = true;
    isSearchOpen.value = false;
  } catch {
    snacks.error(t('anErrorOccurred'));
  }
  isLinkLoading.value = false;
}

defineExpose({
  open,
});
</script>

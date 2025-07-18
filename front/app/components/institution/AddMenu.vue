<template>
  <v-menu
    v-model="isOpen"
    :close-on-content-click="false"
    width="500"
  >
    <template #activator="menu">
      <slot name="activator" v-bind="menu" />
    </template>

    <v-card
      :title="title"
      :subtitle="subtitle"
      :loading="status === 'pending' && 'primary'"
      prepend-icon="mdi-office-building-plus"
      min-height="250"
    >
      <template #append>
        <v-btn variant="text" icon="mdi-close" @click="isOpen = false" />
      </template>

      <template #text>
        <v-row>
          <v-col>
            <v-text-field
              v-model="search"
              :label="$t('search')"
              :error="!!error"
              :error-messages="error"
              prepend-icon="mdi-magnify"
              density="comfortable"
              hide-details
              autofocus
            />
          </v-col>
        </v-row>

        <v-row v-if="!institutions || institutions.length <= 0">
          <v-col>
            <v-empty-state
              icon="mdi-account-question"
              :title="$t('institutions.doesNotExist')"
            />
          </v-col>
        </v-row>

        <v-row v-else>
          <v-col>
            <v-list density="compact">
              <InstitutionAddMenuItem
                v-for="institution in institutions"
                :key="institution.id"
                :model-value="institution"
                :list="modelValue"
                :loading="loadingMap.get(institution.id)"
                @click="addInstitution(institution)"
              />
            </v-list>
          </v-col>
        </v-row>
      </template>
    </v-card>
  </v-menu>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: Array,
    default: () => ([]),
  },
  title: {
    type: String,
    default: undefined,
  },
  subtitle: {
    type: String,
    default: undefined,
  },
  onInstitutionAdd: {
    type: Function,
    default: () => {},
  },
});

const emit = defineEmits({
  'update:model-value': (m) => !!m,
});

const isOpen = ref(false);
const search = ref('');
const debouncedSearch = refDebounced(search, 250);
const loadingMap = ref(new Map());

const {
  data: institutions,
  status,
  error,
} = await useFetch('/api/institutions', {
  query: {
    q: debouncedSearch,
  },
});

async function addInstitution(institution) {
  if (!institution?.id) {
    return;
  }

  loadingMap.value.set(institution.id, true);
  await props.onInstitutionAdd?.(institution);
  loadingMap.value.set(institution.id, false);
  emit('update:model-value', [...props.modelValue, institution]);
  isOpen.value = false;
}
</script>

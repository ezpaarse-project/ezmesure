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
      prepend-icon="mdi-account-plus"
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
              prepend-icon="mdi-account-search"
              density="comfortable"
              hide-details
              autofocus
            />
          </v-col>
        </v-row>

        <v-row v-if="!users || users.length <= 0">
          <v-col>
            <v-empty-state
              icon="mdi-account-question"
              :title="$t('institutions.members.personNotRegistered')"
            />
          </v-col>
        </v-row>

        <v-row v-else>
          <v-col>
            <v-list density="compact">
              <UserAddMenuItem
                v-for="user in users"
                :key="user.username"
                :model-value="user"
                :list="modelValue"
                :loading="loadingMap.get(user.username)"
                @click="addUser(user)"
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
  onUserAdd: {
    type: Function,
    default: () => {},
  },
});

const emit = defineEmits({
  'update:model-value': (m) => !!m,
});

const isOpen = shallowRef(false);
const search = shallowRef('');
const debouncedSearch = refDebounced(search, 250);
const loadingMap = ref(new Map());

const {
  data: users,
  status,
  error,
} = await useFetch('/api/users', {
  query: {
    q: debouncedSearch,
    source: '*',
    include: ['memberships.institution'],
    'deletedAt:from': '',
  },
});

async function addUser(user) {
  if (!user?.username) {
    return;
  }

  loadingMap.value.set(user.username, true);
  await props.onUserAdd?.(user);
  loadingMap.value.set(user.username, false);
  emit('update:model-value', [...props.modelValue, user]);
  isOpen.value = false;
}
</script>

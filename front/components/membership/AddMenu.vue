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
      :title="$t('institutions.members.addMember')"
      :subtitle="institution.name"
      :loading="status === 'pending' && 'primary'"
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

        <v-row v-if="users.length <= 0">
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
              <MembershipAddMenuItem
                v-for="user in users"
                :key="user.username"
                :user="user"
                :institution="institution"
                :loading="loadingMap.get(user.username)"
                @click="addMember($event)"
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
  institution: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits({
  'update:model-value': (m) => !!m,
});

const snacks = useSnacksStore();
const { t } = useI18n();

const isOpen = ref(false);
const search = ref('');
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
    include: 'memberships.institution',
  },
});

async function addMember(user) {
  if (!user?.username) {
    return;
  }

  loadingMap.value.set(user.username, true);
  try {
    const membership = await $fetch(`/api/institutions/${props.institution.id}/memberships/${user.username}`, {
      method: 'PUT',
      body: {},
    });
    emit('update:model-value', membership);
    isOpen.value = false;
  } catch {
    snacks.error(t('institutions.members.cannotAddMember'));
  }
}
</script>

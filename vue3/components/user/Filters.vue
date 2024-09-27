<template>
  <div>
    <v-toolbar
      :title="$t('users.filters.title')"
      style="background-color: transparent;"
    >
      <template #prepend>
        <v-icon icon="mdi-account-search" end />
      </template>

      <template #append>
        <v-btn
          v-tooltip="$t('reset')"
          icon="mdi-filter-off"
          @click="clearFilters"
        />

        <v-btn
          icon="mdi-close"
          @click="$emit('update:show', false)"
        />
      </template>
    </v-toolbar>

    <v-container>
      <v-row>
        <v-col cols="12" sm="6">
          <v-text-field
            v-model="fullName"
            :label="$t('users.user.fullName')"
            :disabled="!!filters.search"
            :messages="filters.search ? $t('users.filters.searchHint') : undefined"
            prepend-icon="mdi-account"
            variant="outlined"
            density="comfortable"
            hide-details="auto"
          />
        </v-col>

        <v-col cols="12" sm="6">
          <v-text-field
            v-model="username"
            :label="$t('users.user.username')"
            :disabled="!!filters.search"
            :messages="filters.search ? $t('users.filters.searchHint') : undefined"
            prepend-icon="mdi-account-outline"
            variant="outlined"
            density="comfortable"
            hide-details="auto"
          />
        </v-col>

        <v-col cols="12" sm="6">
          <v-text-field
            v-model="filters.email"
            :label="$t('users.user.email')"
            prepend-icon="mdi-email"
            variant="outlined"
            density="comfortable"
            hide-details="auto"
          />
        </v-col>

        <v-col cols="12" sm="6">
          <FiltersButtonsGroup
            v-model="filters.isAdmin"
            :label="$t('users.user.isAdmin')"
            prepend-icon="mdi-security"
          />
        </v-col>

        <v-col cols="12">
          <FiltersSelect
            v-model="filters.permissions"
            :empty-symbol="emptySymbol"
            :items="permissionsItems"
            :label="$t('users.user.permissions')"
            prepend-icon="mdi-key"
            chips
            closable-chips
            multiple
          />
        </v-col>

        <v-col cols="12">
          <FiltersSelect
            v-model="filters.roles"
            :empty-symbol="emptySymbol"
            :items="rolesItems"
            :label="$t('users.user.roles')"
            prepend-icon="mdi-tag"
            chips
            closable-chips
            multiple
          />
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits({
  'update:modelValue': (v) => !!v,
  'update:show': (v) => typeof v === 'boolean',
});

const { t } = useI18n();

const {
  emptySymbol,
  filters,
  useFilterWithSearch,
  resetFilters,
} = useFilters(() => props.modelValue, emit);

const fullName = useFilterWithSearch('fullName');
const username = useFilterWithSearch('username');

const permissionsItems = computed(() => {
  const scopes = [
    'institution',
    'memberships',
    'sushi',
    'reporting',
  ];

  return scopes.flatMap((scope) => ['read', 'write'].map(
    (level) => ({
      value: `${scope}:${level}`,
      title: t(`institutions.members.featureLabels.${scope}`),
      props: {
        subtitle: t(`permissions.${level}`),
      },
    }),
  ));
});
const rolesItems = computed(() => {
  const roles = Array.from(roleColors.entries());
  return roles.map(([role, { icon }]) => ({
    value: role,
    title: t(`institutions.members.roleNames.${role}`),
    props: {
      appendIcon: icon,
    },
  }));
});

function clearFilters() {
  resetFilters({ search: '', source: '*' });
  emit('update:show', false);
}
</script>

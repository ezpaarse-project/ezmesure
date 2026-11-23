<template>
  <div>
    <v-toolbar
      :title="$t('users.filters.title')"
      style="background-color: transparent;"
    >
      <template #prepend>
        <v-icon icon="$mdi-account-search" end />
      </template>

      <template #append>
        <v-btn
          v-tooltip="$t('reset')"
          icon="$mdi-filter-off"
          @click="clearFilters"
        />

        <v-btn
          icon="$mdi-close"
          @click="$emit('update:show', false)"
        />
      </template>
    </v-toolbar>

    <v-container>
      <v-row>
        <v-col cols="12" sm="6">
          <ApiFiltersButtonsGroup
            v-model="filters.isAdmin"
            :label="$t('users.user.isAdmin')"
            prepend-icon="$mdi-security"
          />
        </v-col>

        <v-col cols="12" sm="6">
          <ApiFiltersButtonsGroup
            v-model="isDeleted"
            :label="$t('users.user.deletedAt')"
            prepend-icon="$mdi-delete"
          />
        </v-col>

        <v-col cols="12">
          <ApiFiltersSelect
            v-model="permissions"
            v-model:mode="permsMode"
            :empty-symbol="emptySymbol"
            :items="permissionsItems"
            :label="$t('users.user.permissions')"
            prepend-icon="$mdi-key"
            chips
            closable-chips
            multiple
          />
        </v-col>

        <v-col cols="12">
          <ApiFiltersSelect
            v-model="roles"
            v-model:mode="rolesMode"
            :empty-symbol="emptySymbol"
            :items="roleItems"
            :label="$t('users.user.roles')"
            :loading="loadingRoles"
            item-title="label"
            item-value="id"
            prepend-icon="$mdi-tag"
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
  resetFilters,
  defineArrayFilter,
  defineDateFilter,
} = useFilters(() => props.modelValue, emit);

const { state: permissions, modifier: permsMode } = defineArrayFilter('permissions');
const { state: roles, modifier: rolesMode } = defineArrayFilter('roles');

// Transform deletedAt filter into a boolean
const { state: deletedAt, modifier: deletedAtMode } = defineDateFilter('deletedAt');
const isDeleted = computed({
  get: () => {
    if (deletedAt.value === '') {
      return false;
    }

    return deletedAt.value ? true : undefined;
  },
  set: (value) => {
    deletedAtMode.value = 'gte';
    if (value === true) {
      deletedAt.value = new Date(0);
      return;
    }
    if (value === false) {
      deletedAt.value = emptySymbol;
      return;
    }
    deletedAt.value = undefined;
  },
});

const {
  data: roleItems,
  status: rolesStatus,
} = await useFetch('/api/roles', { lazy: true });

const loadingRoles = computed(() => rolesStatus.value === 'pending');

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

function clearFilters() {
  resetFilters({ search: '', source: '*' });
  emit('update:show', false);
}
</script>

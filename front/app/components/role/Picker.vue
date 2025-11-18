<template>
  <v-card :loading="loadingRoles || loading">
    <template v-if="!hideSearch" #text>
      <v-text-field
        v-model="searchRole"
        :placeholder="$t('search')"
        prepend-inner-icon="mdi-magnify"
        variant="outlined"
        density="compact"
        hide-details
        autofocus
      />
    </template>

    <v-empty-state
      v-if="rolesError"
      icon="mdi-alert-circle"
      :title="rolesError"
    >
      <template #actions>
        <v-btn
          :text="$t('retry')"
          :loading="loadingRoles"
          variant="elevated"
          color="secondary"
          @click="refreshRoles"
        />
      </template>
    </v-empty-state>

    <v-list
      v-else
      three-line
      select-strategy="leaf"
      :selected="props.modelValue"
      @click:select="selectRole($event)"
    >
      <v-list-item
        v-for="role in filteredRoles"
        :key="role.id"
        :value="role.id"
        :disabled="disabledItems.has(role.id)"
        :title="role.label"
        :subtitle="role.description"
        :prepend-icon="role.icon ?? 'mdi-tag-outline'"
      >
        <template #append="{ isSelected, select }">
          <v-list-item-action start>
            <v-checkbox-btn :model-value="isSelected" @update:model-value="select" />
          </v-list-item-action>
        </template>
      </v-list-item>
    </v-list>
  </v-card>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: Array,
    default: () => [],
  },
  items: {
    type: Object,
    default: () => ({}),
  },
  hideRestricted: {
    type: Boolean,
    default: () => false,
  },
  disabledItems: {
    type: [Set, Array],
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: () => false,
  },
  hideSearch: {
    type: Boolean,
    default: () => false,
  },
});

const emit = defineEmits({
  'update:modelValue': (value) => Array.isArray(value) || value instanceof Set,
  selected: (role) => !!role,
});

const searchRole = ref('');

const {
  data: availableRoles,
  status: rolesFetchStatus,
  error: rolesFetchError,
  refresh: refreshRoles,
} = await useFetch('/api/roles', { lazy: true });

const loadingRoles = computed(() => props.loading.value || rolesFetchStatus.value === 'pending');
const rolesError = computed(() => rolesFetchError.value && getErrorMessage(rolesFetchError.value));

const disabledItems = computed(() => new Set(props.disabledItems));

const filteredRoles = computed(() => (availableRoles.value ?? []).filter((role) => {
  if (props.hideRestricted.value && role.restricted) { return false; }
  if (!searchRole.value) { return true; }
  if (role.label.toLowerCase().includes(searchRole.value.toLowerCase())) { return true; }
  if (role.description?.toLowerCase().includes(searchRole.value.toLowerCase())) { return true; }
  return false;
}));

const selectRole = ({ id, value }) => {
  const newRoleList = new Set([...props.modelValue, id]);
  if (!value) {
    newRoleList.delete(id);
  }
  emit('update:modelValue', Array.from(newRoleList));
  emit('selected', { role: availableRoles.value.find((r) => r.id === id), value });
};
</script>

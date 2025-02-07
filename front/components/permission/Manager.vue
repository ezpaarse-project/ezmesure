<template>
  <v-card
    :title="$t('repositories.givePermissions')"
    :subtitle="$t('repositories.nPermissions', modelValue?.size ?? 0)"
    :loading="status === 'pending' && 'primary'"
    prepend-icon="mdi-account-lock"
    variant="outlined"
  >
    <template #text>
      <v-table density="comfortable" height="300px" fixed-header>
        <thead>
          <tr>
            <th class="text-left">
              <v-text-field
                v-model="search"
                :placeholder="$t('search')"
                prepend-inner-icon="mdi-magnify"
                density="compact"
                variant="outlined"
                hide-details
              />
            </th>
            <th class="text-right">
              <PermissionSwitch
                v-if="(memberships?.length ?? 0) > 0 && modelValue"
                v-model="allValue"
                icons
                @update:model-value="updateAllPermission($event)"
              />
            </th>
          </tr>
        </thead>

        <tbody v-if="(memberships?.length ?? 0) <= 0">
          <tr>
            <td colspan="2" class="text-center text-secondary">
              {{ $t('institutions.members.noMembers') }}
            </td>
          </tr>
        </tbody>
        <tbody v-else>
          <tr
            v-for="member in sortedMemberships"
            :key="member.username"
          >
            <td>
              <div>
                {{ member.user.fullName }}
                <v-chip
                  v-for="role in member.roles"
                  :key="role"
                  :text=" $t(`institutions.members.roleNames.${role}`)"
                  class="ml-2"
                  size="x-small"
                  density="comfortable"
                  label
                />
              </div>
              <div class="text-caption text-secondary">
                {{ member.user.email }}
              </div>
            </td>
            <td class="text-right">
              <PermissionSwitch
                v-if="modelValue"
                :model-value="modelValue.get(member.username)"
                mandatory
                icons
                @update:model-value="updatePermission(member.username, $event)"
              />
            </td>
          </tr>
        </tbody>
      </v-table>
    </template>
  </v-card>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: Object,
    default: undefined,
  },
  institution: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits({
  'update:modelValue': (permissions) => !!permissions,
});

const search = ref('');
const allValue = ref('');

const {
  status,
  data: memberships,
} = useFetch(`/api/institutions/${props.institution.id}/memberships`, {
  lazy: true,
  query: {
    include: ['user'],
    size: 0,
    q: search,
  },
});

const sortedMemberships = computed(
  () => memberships.value?.toSorted((a, b) => a.user.fullName.localeCompare(b.user.fullName)) ?? [],
);

function setPermission(permissionsMap, username, value) {
  if (value === 'none') {
    permissionsMap.delete(username);
    return;
  }
  permissionsMap.set(username, value);
}

function updatePermission(username, value) {
  const perms = new Map(props.modelValue ?? []);
  setPermission(perms, username, value);
  emit('update:modelValue', perms);
}

function updateAllPermission(value) {
  // Keep copy of current permissions to avoid re-rendering
  const perms = new Map(props.modelValue ?? []);
  memberships.value.forEach((member) => setPermission(perms, member.username, value));
  emit('update:modelValue', perms);
  allValue.value = '';
}
</script>

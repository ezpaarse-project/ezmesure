<template>
  <v-card width="350" density="compact" class="py-2">
    <v-card-title v-tooltip="institution.name" class="text-truncate">
      {{ institution.name }}
    </v-card-title>

    <v-divider />

    <v-card-text class="pa-0">
      <v-list density="compact" class="pa-0">
        <v-list-item
          :disabled="!user.isAdmin && !allowedActions.sushi"
          :to="`/myspace/institutions/${institution.id}/sushi`"
          :title="$t('institutions.sushi.credentials')"
          color="primary"
          prepend-icon="mdi-key"
        />

        <v-list-item
          :disabled="!user.isAdmin && !allowedActions.members"
          :to="`/myspace/institutions/${institution.id}/members`"
          :title="$t('institutions.members.members')"
          color="primary"
          prepend-icon="mdi-account-multiple"
        />

        <v-list-item
          :disabled="!user.isAdmin && !allowedActions.reports"
          :to="`/myspace/institutions/${institution.id}/reports`"
          :title="$t('menu.report')"
          color="primary"
          prepend-icon="mdi-file-chart-outline"
        />
      </v-list>

      <template v-if="(spaces?.length ?? 0) > 0">
        <v-divider class="mt-1 mb-2" />

        <v-list lines="two" density="compact" class="pa-0">
          <v-list-subheader>
            <v-icon icon="mdi-tab" start />
            {{ $t('myspace.spaces') }}
          </v-list-subheader>

          <v-list-item
            v-for="space in spaces"
            :key="space.id"
            v-tooltip="space.name"
            :title="space.name"
            :href="`/kibana/s/${space.id}`"
            append-icon="mdi-open-in-app"
            @click.prevent="openInTab(`/kibana/s/${space.id}`, space.id)"
          >
            <template #subtitle>
              <RepositoryTypeChip
                :model-value="space"
                size="small"
                density="compact"
              />
            </template>
          </v-list-item>
        </v-list>
      </template>
    </v-card-text>
  </v-card>
</template>

<script setup>
const props = defineProps({
  institution: {
    type: Object,
    required: true,
  },
  spacePermissions: {
    type: Array,
    default: () => undefined,
  },
  permissions: {
    type: Array,
    required: true,
  },
});

const { data: user } = useAuthState();
const { openInTab } = useSingleTabLinks('kibanaSpaces');

const spaces = computed(() => props.spacePermissions?.map(({ space }) => space));

const allowedActions = computed(() => {
  const perms = new Set(props.permissions);

  return {
    sushi: perms.has('sushi:read') || perms.has('sushi:write'),
    members: perms.has('memberships:read') || perms.has('memberships:write'),
    reports: perms.has('reporting:read') || perms.has('reporting:write'),
  };
});
</script>

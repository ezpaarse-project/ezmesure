<template>
  <v-card max-width="400" density="compact">
    <v-card-title class="bg-primary">
      <div class="text-truncate">
        {{ institution.name }}
      </div>

      <v-chip
        :text="institution.validated ? $t('institutions.institution.validated') : $t('institutions.institution.notValidated')"
        :color="institution.validated ? 'success' : undefined"
        variant="flat"
        size="small"
        label
      />
    </v-card-title>

    <v-card-text class="pa-0">
      <v-list density="compact" class="pa-0">
        <v-list-item
          v-if="showUpdate"
          :disabled="!user.isAdmin && !permissions.institution"
          :title="$t('modify')"
          prepend-icon="mdi-pencil"
          @click="$emit('click:update', institution);"
        />

        <v-divider />

        <v-list-item
          :disabled="!user.isAdmin && !permissions.sushi"
          :to="`/myspace/institutions/${institution.id}/sushi`"
          :title="$t('institutions.sushi.credentials')"
          color="primary"
          prepend-icon="mdi-key"
        />

        <v-list-item
          :disabled="!user.isAdmin && !permissions.members"
          :to="`/myspace/institutions/${institution.id}/members`"
          :title="$t('institutions.members.members')"
          color="primary"
          prepend-icon="mdi-account-multiple"
        />

        <v-list-item
          :disabled="!user.isAdmin && !permissions.reports"
          :to="`/myspace/institutions/${institution.id}/reports`"
          :title="$t('institutions.reports.reports')"
          color="primary"
          prepend-icon="mdi-file-chart-outline"
        />
      </v-list>
    </v-card-text>
  </v-card>
</template>

<script setup>
defineProps({
  institution: {
    type: Object,
    required: true,
  },
  permissions: {
    type: Object,
    required: true,
  },
  showUpdate: {
    type: Boolean,
    default: false,
  },
});

const { data: user } = useAuthState();

defineEmits({
  'click:update': (institution) => !!institution,
});
</script>

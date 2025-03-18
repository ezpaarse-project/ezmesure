<template>
  <v-list-item
    :key="user.username"
    :title="user.fullName"
    :subtitle="user.email"
    prepend-icon="mdi-account-circle"
    lines="two"
  >
    <template #append>
      <v-menu open-on-hover>
        <template #activator="{ props: menu }">
          <v-chip
            v-if="user.memberships.length > 0"
            :text="`${user.memberships.length}`"
            append-icon="mdi-domain"
            class="mr-4"
            v-bind="menu"
          />
        </template>

        <v-list>
          <v-list-item
            v-for="({ institution: i }) in user.memberships"
            :key="`${user.username}:member:${i.id}`"
            :title="i.name"
            :to="currentUser?.isAdmin ? `/admin/institutions/${i.id}` : undefined"
          >
            <template #prepend>
              <InstitutionAvatar :institution="i" />
            </template>
          </v-list-item>
        </v-list>
      </v-menu>

      <v-btn
        :disabled="isAlreadyMember"
        :loading="loading"
        icon="mdi-account-plus"
        color="primary"
        variant="tonal"
        size="small"
        @click="$emit('click', user)"
      />
    </template>
  </v-list-item>
</template>

<script setup>
const props = defineProps({
  user: {
    type: Object,
    required: true,
  },
  institution: {
    type: Object,
    default: () => ({}),
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

defineEmits({
  click: (user) => !!user,
});

const { data: currentUser } = useAuthState();

const isAlreadyMember = computed(
  () => props.user.memberships?.some(
    ({ institution }) => institution.id === props.institution.id,
  ) ?? false,
);
</script>

<template>
  <v-list-item
    :title="modelValue.fullName"
    :subtitle="modelValue.email"
    prepend-icon="mdi-account-circle"
    lines="two"
  >
    <template #append>
      <v-menu open-on-hover>
        <template #activator="{ props: menu }">
          <v-chip
            v-if="modelValue.memberships.length > 0"
            :text="`${modelValue.memberships.length}`"
            append-icon="mdi-domain"
            class="mr-4"
            v-bind="menu"
          />
        </template>

        <v-list>
          <v-list-item
            v-for="({ institution }) in modelValue.memberships"
            :key="`${modelValue.username}:member:${institution.id}`"
            :title="institution.name"
            :to="currentUser?.isAdmin ? `/admin/institutions/${institution.id}` : undefined"
          >
            <template #prepend>
              <InstitutionAvatar :institution="institution" />
            </template>
          </v-list-item>
        </v-list>
      </v-menu>

      <v-btn
        :disabled="isAlreadyAssigned"
        :loading="loading"
        icon="mdi-account-plus"
        color="primary"
        variant="tonal"
        size="small"
        @click="$emit('click', $event)"
      />
    </template>
  </v-list-item>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
  list: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

defineEmits({
  click: () => true,
});

const { data: currentUser } = useAuthState();

const isAlreadyAssigned = computed(
  () => props.list.some((user) => user.username === props.modelValue.username) ?? false,
);
</script>

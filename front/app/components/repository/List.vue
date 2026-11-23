<template>
  <v-list>
    <slot name="prepend" />

    <v-list-item
      v-for="repository in filteredRepositories"
      :key="repository.pattern"
      :value="repository.pattern"
      :title="repository.pattern"
      prepend-icon="$mdi-database"
      @click="emit('select', repository.pattern)"
    >
      <template #subtitle>
        <RepositoryTypeChip :model-value="repository" />
      </template>
    </v-list-item>

    <slot name="append" />
  </v-list>
</template>

<script setup>
const props = defineProps({
  type: {
    type: String,
    default: () => '',
  },
});

const emit = defineEmits({
  select: (pattern) => !!pattern,
});

const repositories = defineModel({ type: Array, default: [] });

const filteredRepositories = computed(() => {
  if (!props.type) { return repositories.value; }

  return repositories.value.filter((repo) => repo.type === props.type);
});

</script>

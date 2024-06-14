<template>
  <div>
    <v-chip
      v-for="(pkg, index) in item.packages"
      :key="index"
      small
      label
      class="mr-1"
      color="secondary"
    >
      {{ pkg }}
    </v-chip>

    <v-tooltip v-if="item.comment" max-width="35%" right>
      <template #activator="{ on }">
        <v-icon v-on="on">
          mdi-information
        </v-icon>
      </template>

      {{ item.comment }}
    </v-tooltip>
  </div>
</template>

<script setup>
defineProps({
  item: {
    type: Object,
    required: true,
  },
});
</script>

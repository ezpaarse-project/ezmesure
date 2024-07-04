<template>
  <div>
    <SkeletonAppBar @model-value:menu="updateVisibleMenu()" />
    <SkeletonSnackbar />
    <v-main>
      <slot />
    </v-main>
  </div>
</template>

<script setup lang="ts">
const visible = ref(false);

const emit = defineEmits({
  updated: () => true,
});

async function updateVisibleMenu() {
  visible.value = !visible.value;
  emit('updated');
}
</script>

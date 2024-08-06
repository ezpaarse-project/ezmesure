<template>
  <v-app>
    <ClientOnly>
      <SkeletonAppBar @model-value:menu="updateVisibleMenu()" />

      <v-main>
        <SkeletonPageLoader
          :error="error"
          show
          show-refresh
          @click:refresh="handleError()"
        />
      </v-main>
    </ClientOnly>
  </v-app>
</template>

<script setup>
defineProps({
  error: {
    type: Object,
    required: true,
  },
});

const handleError = () => clearError({ redirect: '/' });
</script>

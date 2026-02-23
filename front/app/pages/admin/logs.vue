<template>
  <div class="d-flex flex-column">
    <SkeletonPageBar
      :title="$t('admin.logs.title')"
    />

    <AppLogs
      class="mx-2"
      rounded
      source="/api/api-logs/sse"
      init="/api/api-logs"
      style="height: calc(100vh - 140px);"
    />
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'admin',
  middleware: ['sidebase-auth', 'terms', 'admin'],
});
</script>

<template>
  <div class="d-flex flex-column">
    <SkeletonPageBar
      :title="$t('admin.logs.title')"
    >
      <v-btn
        :text="$t('admin.logs.actions.level.buttonText')"
        variant="flat"
        prepend-icon="$mdi-cog"
        @click="changeLoggingLevel"
      />
    </SkeletonPageBar>

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
import LoggingLevelSelectorDialog from '~/components/logging/LevelSelectorDialog.vue';

const { openDialog } = useDialogStore();

const changeLoggingLevel = () => {
  openDialog({ component: LoggingLevelSelectorDialog });
};
</script>

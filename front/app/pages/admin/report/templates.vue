<template>
  <div>
    <SkeletonPageLoader
      v-if="error"
      :error="error"
      show
      show-refresh
      @click:refresh="refresh()"
    />

    <div v-else>
      <ezr-template-table
        v-model:items-per-page="itemsPerPage"
        :title-prefix="`${$t('menu.adminReport')} / `"
        :items-per-page-options="itemsPerPageOptions"
      >
        <template #prepend>
          <v-btn
            icon="mdi-menu"
            @click="toggle()"
          />
        </template>
      </ezr-template-table>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'admin',
  middleware: ['sidebase-auth', 'terms', 'admin'],
});

const { toggle } = useDrawerStore();

const { error, itemsPerPage, itemsPerPageOptions } = await useEzr();
</script>

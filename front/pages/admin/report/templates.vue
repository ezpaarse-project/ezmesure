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
      <ezr-template-table :title-prefix="`${$t('menu.adminReport')} / `">
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

const { error } = await useEzr();
</script>

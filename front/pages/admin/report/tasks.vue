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
      <ezr-task-table :title-prefix="`${$t('menu.adminReport')} / `">
        <template #prepend>
          <v-btn
            icon="mdi-menu"
            @click="toggle()"
          />
        </template>

        <template #[`item.namespace`]="{ namespace }">
          <nuxt-link :to="`/admin/institutions/${namespace.id}/reports`">
            {{ namespace.name }}
          </nuxt-link>
        </template>
      </ezr-task-table>
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

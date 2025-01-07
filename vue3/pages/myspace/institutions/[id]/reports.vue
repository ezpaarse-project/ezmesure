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
      <ezr-task-cards :namespace-id="params.id">
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
      </ezr-task-cards>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'space',
  middleware: ['auth', 'terms'],
  alias: ['/admin/institutions/:id/reports'],
});

const { params } = useRoute();

const { toggle } = useDrawerStore();

const { error } = await useEzr();
</script>

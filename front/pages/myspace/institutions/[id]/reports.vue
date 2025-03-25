<template>
  <div>
    <SkeletonPageLoader
      v-if="error"
      :error="ezrError || error"
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

        <template #title="{ title }">
          <InstitutionBreadcrumbs :institution="institution" :current="title" />
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
  middleware: ['sidebase-auth', 'terms'],
  alias: ['/admin/institutions/:id/reports'],
});

const { params } = useRoute();

const { toggle } = useDrawerStore();

const { error: ezrError } = await useEzr();

const {
  error,
  data: institution,
} = await useFetch(`/api/institutions/${params.id}`);
</script>

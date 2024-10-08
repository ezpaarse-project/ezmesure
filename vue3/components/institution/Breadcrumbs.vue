<template>
  <div class="d-flex pr-4 pr-lg-8">
    <div class="text-truncate">
      <nuxt-link v-tooltip="institution.name" :to="institutionLink" style="max-width: 10px;">
        {{ institution.name }}
      </nuxt-link>
    </div>
    <div class="mx-1">
      /
    </div>
    <div>{{ current }}</div>
  </div>
</template>

<script setup>
const props = defineProps({
  institution: {
    type: Object,
    required: true,
  },
  current: {
    type: String,
    required: true,
  },
});

const { data: user } = useAuthState();

const institutionLink = computed(() => (user.value?.isAdmin ? `/admin/institutions/${props.institution.id}` : undefined));
</script>

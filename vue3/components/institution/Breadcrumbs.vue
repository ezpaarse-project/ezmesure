<template>
  <nuxt-link :to="institutionLink">
    {{ institution.name }}
  </nuxt-link>
  /
  {{ current }}
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

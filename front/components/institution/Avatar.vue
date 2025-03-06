<template>
  <v-avatar :image="src" icon="mdi-office-building" />
</template>

<script setup>
const props = defineProps({
  logoUrl: {
    type: String,
    default: undefined,
  },
  institution: {
    type: Object,
    default: undefined,
  },
});

const src = computed(() => {
  if (props.logoUrl) {
    return props.logoUrl;
  }
  if (props.institution?.logoId) {
    return `/api/assets/logos/${props.institution.logoId}`;
  }
  return undefined;
});
</script>

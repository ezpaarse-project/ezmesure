<template>
  <nuxt-link :to="`/admin/institutions/${item.id}/sushi`">
    {{ item.name }}
  </nuxt-link>
</template>

<script setup>
defineProps({
  item: {
    type: Object,
    required: true,
  },
});
</script>

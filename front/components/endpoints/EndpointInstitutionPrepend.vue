<template>
  <v-simple-checkbox
    :value="selected"
    @input="$emit('updateModel:selected', !selected)"
  />
</template>

<script setup>
defineProps({
  selected: {
    type: Boolean,
    default: false,
  },
});
</script>

<template>
  <v-sheet
    v-bind="$attrs"
    class="d-flex justify-start flex-column text-center"
    style="gap: 10px"
  >
    <v-icon large :color="color">
      {{ icon }}
    </v-icon>

    <div>{{ text }}</div>

    <slot name="actions" />
  </v-sheet>
</template>

<script>
export default {
  props: {
    text: {
      type: String,
      default: () => '',
    },
    icon: {
      type: String,
      default: () => '',
    },
    color: {
      type: String,
      default: () => '',
    },
  },
};
</script>

<template>
  <v-dialog
    :value="value"
    width="800"
    @input="$emit('input', $event)"
  >
    <v-card>
      <ezr-status-list />
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  props: {
    value: {
      type: Boolean,
      required: true,
    },
  },
};
</script>

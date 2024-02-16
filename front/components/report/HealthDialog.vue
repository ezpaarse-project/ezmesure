<template>
  <v-dialog
    v-model="value"
    width="800"
  >
    <template v-if="$scopedSlots.activator" #activator="{ attrs, on }">
      <slot name="activator" :attrs="attrs" :on="on" />
    </template>

    <v-card>
      <ezr-status-list />
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  data: () => ({
    value: false,
  }),
};
</script>

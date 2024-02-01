<template>
  <v-dialog
    v-model="value"
    min-width="800"
    max-width="1600"
  >
    <template v-if="$scopedSlots.activator" #activator="{ attrs, on }">
      <slot name="activator" :attrs="attrs" :on="on" />
    </template>

    <v-card>
      <iframe
        src="/report/api/v1/doc/"
        loading="lazy"
        width="100%"
        height="800"
        frameborder="0"
      />
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

<template>
  <v-menu
    v-bind="$attrs"
  >
    <template v-for="(_, slot) of $scopedSlots" #[slot]="scope">
      <slot :name="slot" v-bind="scope" />
    </template>

    <v-card>
      <v-card-title v-if="title" class="text-h5">
        {{ title }}
      </v-card-title>
      <v-card-text v-if="message">
        {{ message }}
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn
          small
          text
          @click="disagree"
        >
          {{ disagreeText || $t('cancel') }}
        </v-btn>
        <v-btn
          small
          color="primary"
          @click="agree"
        >
          {{ agreeText || $t('confirm') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-menu>
</template>

<script>
export default {
  props: {
    title: {
      type: String,
      default: () => '',
    },
    message: {
      type: String,
      default: () => '',
    },
    agreeText: {
      type: String,
      default: () => '',
    },
    disagreeText: {
      type: String,
      default: () => '',
    },
  },
  methods: {
    agree() {
      this.$emit('agree');
    },
    disagree() {
      this.$emit('disagree');
    },
  },
};
</script>

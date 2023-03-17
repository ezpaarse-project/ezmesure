<template>
  <v-snackbar
    v-if="currentMessage"
    v-model="visible" bottom
    right
    :color="currentMessage.color"
    :timeout="currentMessage.timeout"
  >
    <div v-for="(text, i) in lines" :key="i" v-text="text" />

    <template #action="{ attrs }">
      <v-btn
        dark
        text
        v-bind="attrs"
        @click.native="visible = false"
        v-text="$t('close')"
      />
    </template>
  </v-snackbar>
</template>

<script>
// eslint-disable-next-line import/no-extraneous-dependencies
import { mapState, mapActions } from 'vuex';

export default {
  data() {
    return {
      visible: false,
    };
  },
  watch: {
    messages() {
      if (!this.visible && this.messages.length) {
        this.visible = true;
      }
    },
    async visible() {
      if (this.visible || !this.messages.length) { return; }

      await this.$nextTick();

      // wait a little before opening the next message
      setTimeout(() => {
        this.shiftMessages();
        this.visible = true;
      }, 200);
    },
  },
  computed: {
    ...mapState('snacks', ['messages']),
    currentMessage() {
      return this.messages[0];
    },
    lines() {
      const text = this.currentMessage?.text;
      const lines = Array.isArray(text) ? text : [text];
      return lines.map((x) => x);
    },
  },
  methods: {
    ...mapActions('snacks', ['shiftMessages']),
  },
};
</script>

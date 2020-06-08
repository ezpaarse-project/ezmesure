<template>
  <v-snackbar
    v-if="currentMessage"
    v-model="visible" bottom
    right
    :color="currentMessage.color"
    :timeout="currentMessage.timeout"
  >
    {{ currentMessage.text }}
    <v-btn
      dark
      text
      @click.native="visible = false"
      v-text="$t('close')"
    />
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
  },
  methods: {
    ...mapActions('snacks', ['shiftMessages']),
  },
};
</script>

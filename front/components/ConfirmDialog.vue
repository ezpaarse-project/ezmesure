<template>
  <v-dialog
    v-model="show"
    persistent
    max-width="400"
  >
    <v-card>
      <v-card-title class="text-h5">
        {{ title }}
      </v-card-title>
      <v-card-text>
        {{ message }}
      </v-card-text>
      <v-card-actions>
        <v-spacer />

        <v-btn
          text
          @click="disagree"
        >
          <v-icon v-if="disagreeIcon" left>
            {{ disagreeIcon }}
          </v-icon>

          {{ disagreeText || $t('cancel') }}
        </v-btn>

        <v-btn
          color="primary"
          @click="agree"
        >
          <v-icon v-if="agreeIcon" left>
            {{ agreeIcon }}
          </v-icon>

          {{ agreeText || $t('confirm') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  data() {
    return {
      show: false,
      title: null,
      message: null,
      agreeText: null,
      agreeIcon: null,
      disagreeText: null,
      disagreeIcon: null,
    };
  },
  methods: {
    open(opts = {}) {
      this.title = opts?.title;
      this.message = opts?.message;
      this.agreeText = opts?.agreeText;
      this.agreeIcon = opts?.agreeIcon;
      this.disagreeText = opts?.disagreeText;
      this.disagreeIcon = opts?.disagreeIcon;
      this.show = true;

      return new Promise((resolve) => {
        this.resolve = resolve;
      });
    },
    agree() {
      this.resolve(true);
      this.show = false;
    },
    disagree() {
      this.resolve(false);
      this.show = false;
    },
  },
};
</script>

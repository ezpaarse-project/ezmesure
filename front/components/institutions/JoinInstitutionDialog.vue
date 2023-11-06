<!-- eslint-disable vue/no-v-text-v-html-on-component -->
<template>
  <v-dialog
    :value="value"
    width="500"
    @input="updateVisible($event)"
  >
    <v-card>
      <v-toolbar
        color="primary"
        flat
        dark
      >
        <v-toolbar-title>
          {{ institution?.name }}
        </v-toolbar-title>
      </v-toolbar>
      <v-card-text
        class="mt-4"
        v-html="$t('institutions.joinInstitution', { institution: institution?.name })"
      />
      <v-card-text>
        {{ $t('institutions.joinInstitutionEmail') }}
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn text outlined @click.stop="updateVisible(false)">
          {{ $t("cancel") }}
        </v-btn>
        <v-btn
          :loading="loading"
          color="primary"
          @click="sendMail()"
        >
          {{ $t("yes") }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  data() {
    return {
      dialog: '',
      admin: true,
      correspondents: true,
      loading: false,
    };
  },
  props: {
    value: {
      type: Boolean,
      default: false,
    },
    institution: {
      type: Object,
      default: () => {},
    },
  },
  methods: {
    updateVisible(visible) {
      this.$emit('input', visible);
    },
    async sendMail() {
      try {
        this.loading = true;
        await this.$axios.$post(`/institutions/${this.institution.id}/_request_membership`);
        this.updateVisible(false);
      } catch (e) {
        this.$store.dispatch('snacks/error', this.$t('anErrorOccurred'));
        this.loading = false;
        return;
      }
      this.loading = false;
      this.$store.dispatch('snacks/info', this.$t('institutions.sendMailToJoin'));
    },
  },
};
</script>

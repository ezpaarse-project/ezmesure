<template>
  <v-menu
    v-model="show"
    :close-on-content-click="false"
    :nudge-width="200"
    offset-x
    max-width="400"
  >
    <template v-slot:activator="{ on, attrs }">
      <v-btn
        small
        icon
        v-bind="attrs"
        v-on="on"
      >
        <v-icon small>
          mdi-comment-check
        </v-icon>
      </v-btn>
    </template>

    <v-card>
      <v-card-text v-if="!isValidatable">
        <v-alert
          dense
          outlined
          type="info"
          v-text="$t('institutions.institution.notValidatable')"
        />
      </v-card-text>

      <v-card-actions>
        <v-btn
          :loading="validating"
          color="error"
          text
          @click="setValidation(false)"
        >
          <v-icon left>
            mdi-comment-remove
          </v-icon>
          {{ $t('institutions.institution.invalidate') }}
        </v-btn>
        <v-btn
          :loading="validating"
          color="success"
          text
          :disabled="!isValidatable"
          @click="setValidation(true)"
        >
          <v-icon left>
            mdi-comment-check
          </v-icon>
          {{ $t('institutions.institution.validate') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-menu>
</template>

<script>
export default {
  props: {
    institution: {
      type: Object,
      default: () => ({}),
    },
  },
  data() {
    return {
      show: false,
      validating: false,
      institutionId: this.institution?.id,
    };
  },
  computed: {
    isValidatable() {
      if (!this.institution?.indexPrefix) { return false; }
      if (!this.institution?.role) { return false; }
      if (!this.institution?.space) { return false; }
      return true;
    },
  },
  methods: {
    async setValidation(validated) {
      this.validating = true;

      try {
        await this.$axios.$put(`/institutions/${this.institutionId}/validated`, {
          value: validated,
        });
        this.$emit('change', validated);
        this.show = false;
      } catch (e) {
        this.$store.dispatch('snacks/error', this.$t('institutions.institution.failedToUpdateValidation'));
      }

      this.validating = false;
    },
  },
};
</script>

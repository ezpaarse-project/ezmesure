<template>
  <v-card outlined>
    <v-card-text>
      <p v-if="topText">
        {{ topText }}
      </p>

      <v-row>
        <v-col cols="12">
          <v-select
            :value="value.scope"
            :label="$t('sushi.scope')"
            :items="availableScopes"
            :disabled="readonly"
            hide-details
            outlined
            dense
            @input="$emit('input', {...value, scope: $event})"
          />
        </v-col>
        <v-col cols="6">
          <v-text-field
            :value="value.name"
            :label="$t('name')"
            :disabled="readonly"
            hide-details
            outlined
            dense
            @input="$emit('input', {...value, name: $event})"
          />
        </v-col>
        <v-col cols="6">
          <v-text-field
            :value="value.value"
            :label="$t('value')"
            :disabled="readonly"
            hide-details
            outlined
            dense
            @input="$emit('input', {...value, value: $event})"
          />
        </v-col>
      </v-row>
    </v-card-text>

    <v-card-actions v-if="!readonly">
      <v-spacer />
      <v-btn small text color="secondary" @click="$emit('remove')">
        <v-icon left>
          mdi-delete
        </v-icon>
        {{ $t('delete') }}
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script>
export default {
  props: {
    value: {
      type: Object,
      default: () => ({}),
    },
    readonly: {
      type: Boolean,
      default: () => false,
    },
    topText: {
      type: String,
      default: () => '',
    },
  },
  emits: {
    input: (value) => !!value,
  },
  computed: {
    availableScopes() {
      return [
        { text: this.$t('sushi.paramScopes.all'), value: 'all' },
        { text: this.$t('sushi.paramScopes.report_list'), value: 'report_list' },
        { text: this.$t('sushi.paramScopes.report_download'), value: 'report_download' },
        { text: this.$t('sushi.paramScopes.report_download_tr'), value: 'report_download_tr' },
        { text: this.$t('sushi.paramScopes.report_download_pr'), value: 'report_download_pr' },
        { text: this.$t('sushi.paramScopes.report_download_dr'), value: 'report_download_dr' },
        { text: this.$t('sushi.paramScopes.report_download_ir'), value: 'report_download_ir' },
      ];
    },
  },
};
</script>

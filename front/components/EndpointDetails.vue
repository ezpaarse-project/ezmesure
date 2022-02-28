<template>
  <v-row>
    <v-col v-for="field in fields" :key="field.label" cols="12">
      <div class="font-weight-medium" v-text="field.label" />
      <div class="text-muted" v-text="field.value" />
    </v-col>

    <v-col v-if="hasParams" cols="12">
      <div class="font-weight-medium" v-text="$t('advancedSettings')" />
      <v-chip v-for="param in item.params" :key="param.name" label class="mr-1">
        {{ param.name }} = {{ param.value }}
      </v-chip>
    </v-col>
  </v-row>
</template>

<script>
export default {
  props: {
    item: {
      type: Object,
      default: () => ({}),
    },
  },
  data() {
    return {};
  },
  computed: {
    hasParams() {
      return Array.isArray(this.item?.params) && this.item.params.length > 0;
    },
    hasTags() {
      return Array.isArray(this.item?.tags) && this.item.tags.length > 0;
    },
    createdAt() {
      const localDate = new Date(this.item?.createdAt);

      if (!this.$dateFunctions.isValid(localDate)) {
        return this.$t('invalidDate');
      }

      return this.$dateFunctions.format(localDate, 'PPPpp');
    },
    updatedAt() {
      const localDate = new Date(this.item?.updatedAt);

      if (!this.$dateFunctions.isValid(localDate)) {
        return this.$t('invalidDate');
      }

      return this.$dateFunctions.format(localDate, 'PPPpp');
    },
    fields() {
      return [
        { value: this.item?.vendor, label: this.$t('endpoints.vendor') },
        { value: this.item?.sushiUrl, label: this.$t('endpoints.url') },
        { value: this.item?.description, label: this.$t('endpoints.description') },
        { value: this.item?.companies, label: this.$t('endpoints.companies') },
        { value: this.item?.counterVersion, label: this.$t('endpoints.counterVersion') },

        { value: this.item?.requireCustomerId ? this.$t('yes') : this.$t('no'), label: this.$t('endpoints.requireCustomerId') },
        { value: this.item?.requireRequestorId ? this.$t('yes') : this.$t('no'), label: this.$t('endpoints.requireRequestorId') },
        { value: this.item?.requireApiKey ? this.$t('yes') : this.$t('no'), label: this.$t('endpoints.requireApiKey') },
        { value: this.item?.isSushiCompliant ? this.$t('yes') : this.$t('no'), label: this.$t('endpoints.isSushiCompliant') },

        { value: this.createdAt, label: this.$t('endpoints.createdAt') },
        { value: this.updatedAt, label: this.$t('endpoints.updatedAt') },
      ].filter(f => f.value);
    },
  },
};
</script>

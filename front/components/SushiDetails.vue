<template>
  <v-row>
    <v-col v-for="field in fields" :key="field.label" cols="12">
      <div class="font-weight-medium">
        {{ field.label }}
      </div>

      <div class="text-muted">
        {{ field.value }}
      </div>
    </v-col>

    <v-col v-if="hasParams" cols="12">
      <div class="font-weight-medium">
        {{ $t('advancedSettings') }}
      </div>

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
    updatedAt() {
      const localDate = new Date(this.item?.updatedAt);

      if (!this.$dateFunctions.isValid(localDate)) {
        return this.$t('invalidDate');
      }

      return this.$dateFunctions.format(localDate, 'PPPpp');
    },
    fields() {
      return [
        { value: this.updatedAt, label: this.$t('institutions.sushi.updatedAt') },
        { value: this.item?.sushiUrl, label: this.$t('institutions.sushi.sushiUrl') },
        { value: this.item?.requestorId, label: this.$t('institutions.sushi.requestorId') },
        { value: this.item?.customerId, label: this.$t('institutions.sushi.customerId') },
        { value: this.item?.apiKey, label: this.$t('institutions.sushi.apiKey') },
        { value: this.item?.comment, label: this.$t('institutions.sushi.comment') },
      ].filter((f) => f.value);
    },
  },
};
</script>

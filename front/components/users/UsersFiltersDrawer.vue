<template>
  <v-navigation-drawer
    :value="show"
    right
    absolute
    temporary
    width="512"
    @input="$emit('update:show', $event)"
  >
    <v-toolbar flat>
      <v-toolbar-title>
        {{ $t('users.filtersTitle') }}
      </v-toolbar-title>

      <v-spacer />

      <v-btn text @click="clearFilters">
        <v-icon left>
          mdi-filter-off
        </v-icon>
        {{ $t('reset') }}
      </v-btn>

      <v-btn icon @click="$emit('update:show', false)">
        <v-icon>
          mdi-close
        </v-icon>
      </v-btn>
    </v-toolbar>

    <v-container>
      <v-row>
        <v-col>
          <v-text-field
            :value="value.fullName"
            :label="$t('users.user.fullName')"
            hide-details
            @input="onFilterUpdate('fullName', $event)"
          />
        </v-col>
      </v-row>

      <v-row>
        <v-col>
          <v-text-field
            :value="value.username"
            :label="$t('users.user.username')"
            hide-details
            @input="onFilterUpdate('username', $event)"
          />
        </v-col>
      </v-row>

      <v-row>
        <v-col>
          <v-text-field
            :value="value.email"
            :label="$t('users.user.email')"
            hide-details
            @input="onFilterUpdate('email', $event)"
          />
        </v-col>
      </v-row>

      <v-row>
        <v-col>
          <v-select
            :value="value.isAdmin"
            :items="nullableBooleanOptions"
            :label="$t('users.user.isAdmin')"
            @change="onFilterUpdate('isAdmin', typeof $event === 'boolean' ? $event : undefined)"
          />
        </v-col>
      </v-row>
    </v-container>
  </v-navigation-drawer>
</template>

<script>
export default {
  props: {
    value: {
      type: Object,
      required: true,
    },
    show: {
      type: Boolean,
      required: true,
    },
  },
  emits: ['input', 'update:show'],
  computed: {
    nullableBooleanOptions() {
      return [
        { text: '', value: undefined },
        { text: this.$t('yes'), value: true },
        { text: this.$t('no'), value: false },
      ];
    },
  },
  methods: {
    onFilterUpdate(field, val) {
      const filters = { ...this.value };
      filters[field] = val;
      this.$emit('input', filters);
    },
    onThreeStateClick(field) {
      let val = this.value[field];
      switch (val) {
        case true:
          val = false;
          break;
        case false:
          val = undefined;
          break;
        default:
          val = true;
          break;
      }
      this.onFilterUpdate(field, val);
    },
    clearFilters() {
      this.$emit('input', {});
      this.$emit('update:show', false);
    },
  },
};
</script>

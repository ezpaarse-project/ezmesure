<template>
  <v-menu
    v-model="showPopover"
    open-on-hover
    offset-x
    :close-on-content-click="false"
    nudge-width="300"
  >
    <template v-slot:activator="{ on, attrs }">
      <v-btn
        icon
        :loading="loading"
        v-bind="attrs"
        v-on="on"
      >
        <v-icon :color="color" small>
          {{ icon }}
        </v-icon>
      </v-btn>
    </template>

    <v-card>
      <v-list>
        <v-list-item>
          <v-list-item-avatar>
            <v-icon :color="color">
              {{ icon }}
            </v-icon>
          </v-list-item-avatar>

          <v-list-item-content>
            <v-list-item-title>
              <span
                v-if="success === true"
                v-text="$t('institutions.sushi.connectionSuccessful')"
              />
              <span
                v-else-if="success === false"
                v-text="$t('institutions.sushi.connectionFailed')"
              />
              <span
                v-else
                v-text="$t('institutions.sushi.connectionUntested')"
              />
            </v-list-item-title>
            <v-list-item-subtitle v-if="date">
              {{ $t('institutions.sushi.testedOn', { date: localDate }) }}
            </v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>
      </v-list>

      <v-divider v-if="hasExceptions" />

      <v-card-text v-if="hasExceptions">
        <ul>
          <li v-for="(exception, index) in exceptions" :key="index" v-text="exception" />
        </ul>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn
          small
          color="primary"
          text
          :disabled="locked"
          :loading="loading"
          @click="$emit('checkConnection')"
        >
          <v-icon left>
            mdi-connection
          </v-icon>
          {{ $t('institutions.sushi.checkConnection') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-menu>
</template>

<script>
export default {
  props: {
    connection: {
      type: Object,
      default: () => ({}),
    },
    loading: {
      type: Boolean,
      default: () => false,
    },
    locked: {
      type: Boolean,
      default: () => false,
    },
  },
  data() {
    return {
      showPopover: false,
    };
  },
  computed: {
    success() { return this.connection?.success; },
    date() { return this.connection?.date; },
    exceptions() { return this.connection?.exceptions; },
    hasExceptions() { return Array.isArray(this.exceptions) && this.exceptions.length > 0; },
    localDate() {
      const localDate = new Date(this.connection?.date);

      if (!this.$dateFunctions.isValid(localDate)) {
        return this.$t('invalidDate');
      }

      return this.$dateFunctions.format(localDate, 'PPPpp');
    },
    icon() {
      if (this.success === true) { return 'mdi-lan-connect'; }
      if (this.success === false) { return 'mdi-lan-disconnect'; }
      return 'mdi-lan-pending';
    },
    color() {
      if (this.success === true) { return 'green'; }
      if (this.success === false) { return 'red'; }
      return 'grey';
    },
  },
};
</script>

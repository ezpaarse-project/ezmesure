<template>
  <v-menu
    :disabled="!connectionState.icon"
    :close-on-content-click="false"
    open-on-hover
    top
    nudge-top="40"
    max-width="600"
  >
    <template #activator="{ on }">
      <v-btn
        :disabled="!valid"
        :loading="connectionState.loading"
        :text="!valid"
        :color="connectionState.color"
        @click="checkConnection()"
        v-on="on"
      >
        {{ connectionState.text }}

        <v-icon v-if="connectionState.icon" right>
          {{ connectionState.icon }}
        </v-icon>
      </v-btn>
    </template>

    <SushiConnectionDetails :connection="sushi.connection" />
  </v-menu>
</template>

<script>
import { defineComponent } from 'vue';

import SushiConnectionDetails from '~/components/sushis/SushiConnectionDetails.vue';

export default defineComponent({
  components: {
    SushiConnectionDetails,
  },
  props: {
    sushi: {
      type: Object,
      required: true,
    },
    endpoint: {
      type: Object,
      required: true,
    },
    valid: {
      type: Boolean,
      default: true,
    },
    institutionId: {
      type: String,
      default: undefined,
    },
    menuProps: {
      type: Object,
      default: () => ({}),
    },
  },
  emits: ['update:connection'],
  data: () => ({

  }),
  computed: {
    connectionState() {
      if (!this.sushi.connection) {
        return {
          loading: false,
          text: this.$t('institutions.sushi.checkCredentials'),
          icon: undefined,
          color: 'primary',
        };
      }

      let text;
      let icon;
      let color;
      switch (this.sushi.connection.status) {
        case 'success':
          text = this.$t('institutions.sushi.operational');
          icon = 'mdi-check';
          color = 'success';
          break;
        case 'failed':
          text = this.$t('error');
          icon = 'mdi-close';
          color = 'error';
          break;
        case 'unauthorized':
          text = this.$t('institutions.sushi.invalidCredentials');
          icon = 'mdi-key-alert-outline';
          color = 'warning';
          break;
        default:
          text = this.$t('institutions.sushi.untested');
          icon = 'mdi-lan-pending';
          color = 'grey';
          break;
      }

      return {
        loading: this.sushi.connection.status === undefined,
        text,
        icon,
        color,
      };
    },
  },
  methods: {
    async checkConnection() {
      if (this.connectionState.loading) {
        return;
      }

      this.$emit('update:connection', {});
      try {
        const connection = await this.$axios.$post(
          '/sushi/_check_connection',
          {
            ...this.sushi,
            endpoint: this.endpoint,
            institution: this.institutionId && { id: this.institutionId },
          },
        );
        this.$emit('update:connection', connection);
      } catch {
        this.$emit('update:connection', undefined);
        this.$store.dispatch('snacks/error', this.$t('institutions.sushi.cannotCheckCredentials', { name: this.endpoint?.vendor }));
      }
    },
  },
});
</script>

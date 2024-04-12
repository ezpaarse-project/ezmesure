<template>
  <v-row>
    <v-col cols="6">
      <v-row>
        <v-col class="d-flex align-center" style="gap: 0.5rem;">
          <v-icon>mdi-domain</v-icon>

          {{ $t('institutions.toolbarTitle', { count: institutions.length }) }}
        </v-col>
      </v-row>

      <v-row>
        <v-col class="pt-0">
          <v-list dense two-line>
            <v-virtual-scroll :items="institutions" height="300" item-height="64">
              <template #default="{ item }">
                <v-list-item :key="item.id">
                  <v-list-item-content>
                    <v-list-item-title>
                      {{ item.name }}
                    </v-list-item-title>

                    <v-list-item-subtitle v-if="item.acronym">
                      {{ item.acronym }}
                    </v-list-item-subtitle>
                  </v-list-item-content>
                </v-list-item>
              </template>
            </v-virtual-scroll>
          </v-list>
        </v-col>
      </v-row>
    </v-col>

    <v-divider vertical />

    <v-col cols="6">
      <v-row>
        <v-col class="d-flex align-center" style="gap: 0.5rem;">
          <v-icon>mdi-web</v-icon>

          {{ $t('endpoints.title', { count: endpoints.length }) }}
        </v-col>
      </v-row>

      <v-row>
        <v-col class="pt-0">
          <v-list dense>
            <v-virtual-scroll :items="endpoints" height="300" item-height="32">
              <template #default="{ item }">
                <v-list-item :key="item.id">
                  <v-list-item-content>
                    <v-list-item-title>
                      {{ item.vendor }}
                    </v-list-item-title>
                  </v-list-item-content>
                </v-list-item>
              </template>
            </v-virtual-scroll>
          </v-list>
        </v-col>
      </v-row>
    </v-col>
  </v-row>
</template>

<script>
import { defineComponent } from 'vue';

export default defineComponent({
  props: {
    sessionId: {
      type: String,
      required: true,
    },
  },
  emit: ['update:loading'],
  data: () => ({
    show: false,
    credentials: [],
    valid: false,
  }),
  computed: {
    institutions() {
      const institutions = new Map(
        this.credentials
          .map((credential) => [credential.institutionId, credential.institution]),
      );
      return [...institutions.values()].sort((a, b) => a.name.localeCompare(b.name));
    },
    endpoints() {
      const endpoints = new Map(
        this.credentials
          .map((credential) => [credential.endpointId, credential.endpoint]),
      );
      return [...endpoints.values()].sort((a, b) => a.vendor.localeCompare(b.vendor));
    },
  },
  watch: {
    sessionId: {
      immediate: true,
      async handler() {
        await this.refreshCredentials();
      },
    },
  },
  methods: {
    async refreshCredentials() {
      this.$emit('update:loading', true);
      try {
        const { data } = await this.$axios.get(
          `/harvests-sessions/${this.sessionId}/credentials`,
          { params: { include: ['endpoint', 'institution'] } },
        );
        this.credentials = data;
      } catch (e) {
        this.$store.dispatch('snacks/error', this.$t('harvest.sessions.unableToRetrieveCredentials'));
      }
      this.$emit('update:loading', false);
    },
  },
});
</script>

<style scoped>

</style>

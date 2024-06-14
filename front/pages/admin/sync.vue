<template>
  <section>
    <ToolBar :title="$t('menu.sync')">
      <v-chip v-if="syncState.startedAt" small outlined class="ml-2">
        <v-icon left small>
          mdi-calendar-blank
        </v-icon>

        {{ startedAt }}
      </v-chip>

      <v-chip v-if="syncState.runningTime" small outlined class="ml-2">
        <v-icon left small>
          mdi-timer-outline
        </v-icon>

        {{ runningTime }}
      </v-chip>

      <v-spacer />

      <v-btn
        color="primary"
        text
        :disabled="synchronizing"
        @click.stop="startSync"
      >
        <v-icon left>
          mdi-play
        </v-icon>

        {{ $t('sync.start') }}
      </v-btn>

      <v-btn
        color="primary"
        text
        :loading="refreshing"
        @click.stop="refreshAll"
      >
        <v-icon left>
          mdi-refresh
        </v-icon>
        {{ $t('refresh') }}
      </v-btn>
    </ToolBar>

    <v-container>
      <v-row>
        <v-col>
          <v-alert
            :color="status.color || 'primary'"
            prominent
            style="color: white;"
          >
            <template v-if="synchronizing || status.icon" #prepend>
              <div class="mr-4">
                <v-progress-circular
                  v-if="synchronizing"
                  size="32"
                  indeterminate
                />
                <v-icon v-else color="white" size="32">
                  {{ status.icon }}
                </v-icon>
              </div>
            </template>

            <h2>
              {{ status.label || $t(`sync.status.${syncState.status}`) }}
            </h2>

            <div v-if="status.description">
              {{ status.description }}
            </div>
          </v-alert>
        </v-col>
      </v-row>

      <v-row>
        <v-col>
          <div class="text-overline primary--text">
            Kibana
          </div>

          <v-row>
            <v-col style="max-width: 300px;">
              <SyncCard
                :label="$t('sync.spaces')"
                :value="syncState.result?.spaces ?? {}"
                :expected="expectedData.spaces ?? 0"
                :synchronizing="synchronizing"
              />
            </v-col>
          </v-row>
        </v-col>

        <v-col>
          <div class="text-overline primary--text">
            Elastic
          </div>

          <v-row>
            <v-col style="max-width: 300px;">
              <SyncCard
                :label="$t('sync.repositories')"
                :value="syncState.result?.repositories ?? {}"
                :expected="expectedData.repositories ?? 0"
                :synchronizing="synchronizing"
              />
            </v-col>

            <v-col style="max-width: 300px;">
              <SyncCard
                :label="$t('sync.users')"
                :value="syncState.result?.users ?? {}"
                :expected="expectedData.users ?? 0"
                :synchronizing="synchronizing"
              />
            </v-col>
          </v-row>
        </v-col>
      </v-row>

      <v-spacer class="py-4" />

      <div class="text-overline primary--text">
        ezREEPORT
      </div>

      <v-row>
        <v-col style="max-width: 300px;">
          <SyncCard
            :label="$t('sync.ezreeportUsers')"
            :value="syncState.result?.ezreeportUsers ?? {}"
            :expected="expectedData.users ?? 0"
            :synchronizing="synchronizing"
          />
        </v-col>

        <v-col style="max-width: 300px;">
          <SyncCard
            :label="$t('sync.ezreeportNamespaces')"
            :value="syncState.result?.ezreeportNamespaces ?? {}"
            :expected="expectedData.institutions ?? 0"
            :synchronizing="synchronizing"
          />
        </v-col>
      </v-row>
    </v-container>
  </section>
</template>

<script>
import { defineComponent } from 'vue';
import ToolBar from '~/components/space/ToolBar.vue';
import SyncCard from '../../components/SyncCard.vue';

export default defineComponent({
  layout: 'space',
  middleware: ['auth', 'terms', 'isAdmin'],
  components: {
    ToolBar,
    SyncCard,
  },
  data: () => ({
    refreshing: false,

    syncState: {},
    expectedData: {},
  }),
  computed: {
    synchronizing() { return this.syncState.status === 'synchronizing'; },
    startedAt() {
      const date = new Date(this.syncState.startedAt);
      return this.$t(
        'sync.startedAt',
        { date: this.$dateFunctions.format(date, 'PPPpp') },
      );
    },
    runningTime() {
      return this.$t(
        'sync.running',
        { time: this.$dateFunctions.msToLocalDistance(this.syncState.runningTime) },
      );
    },
    states() {
      return {
        idle: {
          color: 'orange',
          icon: 'mdi-alert',
          label: this.$t('sync.status.notSynced'),
          description: this.$t('sync.description.notSynced'),
        },
        synchronizing: {
          color: 'blue',
        },
        completed: {
          color: 'green',
          icon: 'mdi-check',
          description: this.$t('sync.description.completed'),
        },
        error: {
          color: 'red',
          icon: 'mdi-alert-circle',
          label: this.$t('sync.status.error'),
          description: this.$t('sync.description.error'),
        },
      };
    },
    status() {
      const status = this.syncState.hasErrors && !this.synchronizing
        ? 'error'
        : this.syncState.status;

      return this.states[status] || this.states.idle;
    },
  },
  mounted() {
    this.refreshAll();
  },
  methods: {
    async refreshAll() {
      await Promise.all([
        this.refreshState(),
        this.refreshExpected(),
      ]);
    },
    async refreshExpected() {
      const getData = (url, params = {}) => this.$axios.$get(
        url,
        { params: { size: 0, ...params } },
      );

      try {
        const [
          repositories,
          users,
          institutions,
        ] = await Promise.all([
          getData('/repositories'),
          getData('/users'),
          getData('/institutions', { validated: true, include: ['spaces'] }),
        ]);
        const spaces = institutions.map((i) => i.spaces).flat();

        this.expectedData = {
          spaces: spaces.length,
          repositories: repositories.length,
          users: users.length,
          institutions: institutions.length,
        };
      } catch (e) {
        this.$store.dispatch('snacks/error', this.$t('sync.unableToRetrieveInformations'));
      }
    },
    async refreshState() {
      this.refreshing = true;
      try {
        this.syncState = await this.$axios.$get('/sync');
      } catch (e) {
        this.$store.dispatch('snacks/error', this.$t('sync.unableToRetrieveInformations'));
      }
      this.refreshing = false;
    },
    async startSync() {
      this.refreshing = true;

      try {
        this.syncState = await this.$axios.$post('/sync/_start');
      } catch (e) {
        this.$store.dispatch('snacks/error', this.$t('sync.unableToStart'));
        return;
      } finally {
        this.refreshing = false;
      }

      while (this.synchronizing) {
        // eslint-disable-next-line no-await-in-loop
        await new Promise((resolve) => { setTimeout(resolve, 1000); });

        // eslint-disable-next-line no-await-in-loop
        await this.refreshState();
      }
    },
  },
});
</script>

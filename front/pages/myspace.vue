<template>
  <section>
    <ToolBar :title="$t('myspace.title')">
      <slot>
        <v-spacer />

        <v-btn text :href="refreshUrl">
          <v-icon left>
            mdi-refresh
          </v-icon>
          {{ $t('refresh') }}
        </v-btn>
      </slot>
    </ToolBar>

    <v-card-text class="w-800 mx-auto">
      <v-alert
        type="info"
        prominent
        :value="!hasRoles"
      >
        <div class="headline">
          {{ $t('myspace.noRoles') }}
        </div>

        <div>
          {{ $t('myspace.determineAccesRight') }}
        </div>
      </v-alert>
      <v-text-field
        :value="user.fullName"
        :label="$t('myspace.name')"
        readonly
        outlined
      />

      <v-text-field
        :value="user.email"
        :label="$t('myspace.mail')"
        readonly
        outlined
      />

      <v-text-field
        :value="metadata.idp"
        :label="$t('myspace.idp')"
        readonly
        outlined
      />

      <v-text-field
        :value="metadata.org"
        :label="$t('myspace.organization')"
        readonly
        outlined
      />

      <v-text-field
        :value="metadata.unit"
        :label="$t('myspace.unit')"
        readonly
        outlined
      />

      <v-card v-if="hasRoles" outlined>
        <v-card-text>
          <div class="title">
            {{ $t('myspace.yourRights') }}
          </div>

          <div class="mb-2">
            {{ $t('myspace.whatDoesRoles') }}
          </div>

          <div>
            <v-chip
              v-for="role in user.roles"
              :key="role"
              class="mr-2"
              label
              outlined
              color="accent"
            >
              {{ role }}
            </v-chip>
          </div>
        </v-card-text>
      </v-card>
    </v-card-text>
  </section>
</template>

<script>
import ToolBar from '~/components/space/ToolBar.vue';

export default {
  layout: 'space',
  middleware: ['auth', 'terms'],
  components: {
    ToolBar,
  },
  data() {
    return {
      selectedFiles: [],
      token: '',
    };
  },
  computed: {
    drawer: {
      get() { return this.$store.state.drawer; },
      set(newVal) { this.$store.dispatch('SET_DRAWER', newVal); },
    },
    refreshUrl() {
      const currentLocation = encodeURIComponent(window.location.href);
      return `/login?refresh=1&origin=${currentLocation}`;
    },
    user() { return this.$auth.user; },
    metadata() { return (this.user && this.user.metadata) || {}; },
    hasRoles() { return Array.isArray(this.user.roles) && this.user.roles.length > 0; },
  },
};
</script>

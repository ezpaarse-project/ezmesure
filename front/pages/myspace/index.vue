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

    <v-card class="w-800 mx-auto">
      <v-card-title>
        {{ $t('myspace.infos') }}
      </v-card-title>

      <v-card-text>
        <v-alert
          type="info"
          prominent
          :value="!hasMemberships"
        >
          <div class="headline">
            {{ $t('myspace.noMemberships') }}
          </div>

          <div>
            {{ $t('myspace.determineAccessRight') }}
          </div>
        </v-alert>

        <v-list>
          <v-list-item v-for="field in fields" :key="field.name">
            <v-list-item-icon>
              <v-icon color="secondary">
                {{ field.icon }}
              </v-icon>
            </v-list-item-icon>

            <v-list-item-content>
              <v-list-item-title>{{ field.value }}</v-list-item-title>
              <v-list-item-subtitle>
                {{ $t(`myspace.${field.name}`) }}
              </v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>

    <v-card v-if="hasMemberships" class="w-800 mx-auto mt-5">
      <v-card-title>
        {{ $t('myspace.yourRights') }}
      </v-card-title>

      <v-card-text>
        <p>
          {{ $t('myspace.whatDoesMemberships') }}
        </p>

        <v-row>
          <v-col v-if="repos.length > 0">
            <v-list>
              <v-subheader>{{ $t('myspace.repos') }}</v-subheader>

              <v-list-item
                v-for="(repo, i) in repos"
                :key="i"
              >
                <v-list-item-icon>
                  <v-icon>mdi-tray-arrow-down</v-icon>
                </v-list-item-icon>
                <v-list-item-content>
                  <v-list-item-title>{{ repo.repositoryPattern }}</v-list-item-title>
                  <v-list-item-subtitle>
                    {{ repo.readonly ? $t('permissions.read') : $t('permissions.write') }}

                    <v-icon v-if="repo.locked" small>
                      mdi-lock
                    </v-icon>
                  </v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>
            </v-list>
          </v-col>

          <v-col v-if="spaces.length > 0">
            <v-list>
              <v-subheader>{{ $t('myspace.spaces') }}</v-subheader>

              <v-list-item
                v-for="(space, i) in spaces"
                :key="i"
                :href="`/kibana/s/${space.spaceId}/spaces/enter`"
              >
                <v-list-item-icon>
                  <v-icon>mdi-tab</v-icon>
                </v-list-item-icon>
                <v-list-item-content>
                  <v-list-item-title>{{ space.spaceId }}</v-list-item-title>
                  <v-list-item-subtitle>
                    {{ space.readonly ? $t('permissions.read') : $t('permissions.write') }}

                    <v-icon v-if="space.locked" small>
                      mdi-lock
                    </v-icon>
                  </v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>
            </v-list>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
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
    refreshUrl() {
      const currentLocation = encodeURIComponent(window.location.href);
      return `/login?refresh=1&origin=${currentLocation}`;
    },
    user() { return this.$auth.user; },
    metadata() { return (this.user && this.user.metadata) || {}; },
    hasMemberships() {
      return Array.isArray(this.user?.memberships) && this.user.memberships.length > 0;
    },
    repos() {
      return this.user?.memberships?.map(
        (m) => m.repositoryPermissions,
      )?.flat() ?? [];
    },
    spaces() {
      return this.user?.memberships?.map(
        (m) => m.spacePermissions,
      )?.flat() ?? [];
    },
    fields() {
      const fields = [
        { name: 'name', value: this.user.fullName, icon: 'mdi-account' },
        { name: 'mail', value: this.user.email, icon: 'mdi-email' },
        { name: 'idp', value: this.metadata.idp, icon: 'mdi-web' },
        { name: 'organization', value: this.metadata.org, icon: 'mdi-domain' },
        { name: 'unit', value: this.metadata.unit, icon: 'mdi-account-group' },
      ];

      return fields.filter((f) => f.value);
    },
  },
};
</script>

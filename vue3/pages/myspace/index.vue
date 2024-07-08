<template>
  <div>
    <SkeletonPageBar :title="$t('myspace.title')" />

    <v-container>
      <v-row>
        <v-col>
          <v-card>
            <v-card-title class="d-flex">
              {{ $t('myspace.infos') }}

              <v-spacer />

              <v-btn v-if="refreshShibUrl" :href="refreshShibUrl" variant="text">
                <v-icon left>
                  mdi-refresh
                </v-icon>
                {{ $t('refresh') }}
              </v-btn>
            </v-card-title>

            <v-card-text>
              <v-list>
                <v-list-item
                  v-for="field in fields"
                  :key="field.name"
                  :prepend-icon="field.icon"
                  :title="field.value"
                  :subtitle="$t(`myspace.${field.name}`)"
                />
              </v-list>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <v-row>
        <v-col>
          <v-alert
            v-if="!hasMemberships"
            :title="$t('myspace.noMemberships')"
            :text="$t('myspace.determineAccessRight')"
            type="info"
            variant="elevated"
            prominent
          />

          <v-card v-else :title="$t('myspace.yourRights')">
            <template #text>
              <p>
                {{ $t('myspace.whatDoesMemberships') }}
              </p>

              <v-row>
                <v-col v-if="spacesPermissions.length > 0">
                  <v-list>
                    <v-list-subheader>{{ $t('myspace.spaces') }}</v-list-subheader>

                    <v-list-item
                      v-for="(permission, i) in spacesPermissions"
                      :key="i"
                      :href="`/kibana/s/${permission.spaceId}/spaces/enter`"
                      :title="permission.space.name || permission.spaceId"
                      prepend-icon="mdi-tab"
                      append-icon="mdi-arrow-right"
                    >
                      <template #subtitle>
                        {{ permission.readonly ? $t('permissions.read') : $t('permissions.write') }}

                        <v-chip
                          :text="permission.space.type"
                          :color="repoColors.get(permission.space.type)"
                          size="x-small"
                          density="comfortable"
                          rounded="pill"
                          class="ml-2"
                          style="color: white;"
                        />
                      </template>
                    </v-list-item>
                  </v-list>
                </v-col>

                <v-col v-if="reposPermissions.length > 0">
                  <v-list>
                    <v-list-subheader>{{ $t('myspace.repos') }}</v-list-subheader>

                    <v-list-item
                      v-for="(permission, i) in reposPermissions"
                      :key="i"
                      :title="permission.repositoryPattern"
                      prepend-icon="mdi-database-outline"
                    >
                      <template #subtitle>
                        {{ permission.readonly ? $t('permissions.read') : $t('permissions.write') }}

                        <v-chip
                          :text="permission.repository.type"
                          :color="repoColors.get(permission.repository.type)"
                          size="x-small"
                          density="comfortable"
                          rounded="pill"
                          class="ml-2"
                          style="color: white;"
                        />
                      </template>
                    </v-list-item>
                  </v-list>
                </v-col>
              </v-row>
            </template>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'space',
  middleware: ['auth', 'terms'],
});

const { public: config } = useRuntimeConfig();
const { data: user } = useAuthState();
const { hasMemberships, spacesPermissions, reposPermissions } = storeToRefs(useCurrentUserStore());

const refreshShibUrl = computed(() => {
  if (!config.shibbolethEnabled) {
    return '';
  }

  const currentLocation = encodeURIComponent(window.location.href);
  return `/login?refresh=1&origin=${currentLocation}`;
});

const fields = computed(
  () => [
    { name: 'name', value: user.value.fullName, icon: 'mdi-account' },
    { name: 'mail', value: user.value.email, icon: 'mdi-email' },
    { name: 'idp', value: user.value.metadata?.idp, icon: 'mdi-web' },
    { name: 'organization', value: user.value.metadata?.org, icon: 'mdi-domain' },
    { name: 'unit', value: user.value.metadata?.unit, icon: 'mdi-account-group' },
  ].filter((f) => f.value),
);
</script>

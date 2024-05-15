<template>
  <v-dialog
    v-model="show"
    scrollable
    width="750"
  >
    <v-card>
      <v-card-title class="headline">
        {{ $t('institutions.toolbarTitle', { count: memberships.length }) }}
        <v-spacer />
      </v-card-title>

      <v-card-text>
        <v-list>
          <v-divider />

          <template v-for="(membership) in memberships">
            <v-list-item :key="membership.institution.id">
              <v-list-item-avatar>
                <v-img
                  v-if="membership.institution.logoId"
                  :src="`/api/assets/logos/${membership.institution.logoId}`"
                />
                <v-icon v-else>
                  mdi-domain
                </v-icon>
              </v-list-item-avatar>

              <v-list-item-content>
                <v-list-item-title>
                  <v-icon v-if="membership.locked">
                    mdi-lock
                  </v-icon>

                  <nuxt-link :to="`/admin/institutions/${items[0].institution.id}/members`">
                    {{ membership.institution.name }}
                  </nuxt-link>
                </v-list-item-title>

                <v-list-item-subtitle
                  v-if="Array.isArray(membership.roles) && membership.roles.length"
                >
                  {{ $t('users.user.roles') }}:

                  <div class="d-flex flex-wrap">
                    <UserTagChip
                      v-for="role in membership.roles"
                      :key="`${membership.institutionId}-role-${role}`"
                      :tag="role"
                    />
                  </div>
                </v-list-item-subtitle>

                <v-list-item-subtitle
                  v-if="Array.isArray(membership.permissions) && membership.permissions.length"
                >
                  {{ $t('users.user.permissions') }}:

                  <div class="d-flex flex-wrap">
                    <UserTagChip
                      v-for="permission in membership.permissions"
                      :key="`${membership.institutionId}-perm-${permission}`"
                      :tag="permission"
                    />
                  </div>
                </v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>

            <v-divider :key="`${membership.institution.id}-divider`" />
          </template>
        </v-list>
      </v-card-text>

      <v-card-actions>
        <v-spacer />

        <v-btn text @click="show = false">
          {{ $t('close') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import UserTagChip from './UserTagChip.vue';

export default {
  components: {
    UserTagChip,
  },
  data() {
    return {
      show: false,

      memberships: [],
      scopeColors: {},
    };
  },
  methods: {
    display(user) {
      this.memberships = Array.isArray(user?.memberships) ? user.memberships : [];
      this.show = true;
    },
  },
};
</script>

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
        {{ $t('users.filters.title') }}
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
            :value="search || value.fullName"
            :label="$t('users.user.fullName')"
            :disabled="!!search"
            :messages="search ? [$t('users.filters.searchHint')] : []"
            prepend-icon="mdi-account"
            hide-details="auto"
            @change="onFilterUpdate('fullName', $event)"
          />
        </v-col>

        <v-col>
          <v-text-field
            :value="search || value.username"
            :label="$t('users.user.username')"
            :disabled="!!search"
            :messages="search ? [$t('users.filters.searchHint')] : []"
            prepend-icon="mdi-account-outline"
            hide-details="auto"
            @change="onFilterUpdate('username', $event)"
          />
        </v-col>
      </v-row>

      <v-row>
        <v-col>
          <v-text-field
            :value="search || value.email"
            :label="$t('users.user.email')"
            :disabled="!!search"
            :messages="search ? [$t('users.filters.searchHint')] : []"
            prepend-icon="mdi-email"
            hide-details="auto"
            @change="onFilterUpdate('email', $event)"
          />
        </v-col>

        <v-col>
          <v-input
            prepend-icon="mdi-security"
            hide-details
            style="padding-top: 12px; margin-top: 4px;"
          >
            <v-label class="button-group-label">
              {{ $t('users.user.isAdmin') }}
            </v-label>

            <v-btn-toggle
              :value="value.isAdmin"
              dense
              rounded
              color="primary"
              @change="onFilterUpdate('isAdmin', $event)"
            >
              <v-btn :value="true" small outlined>
                {{ $t('yes') }}
              </v-btn>

              <v-btn :value="false" small outlined>
                {{ $t('no') }}
              </v-btn>
            </v-btn-toggle>
          </v-input>
        </v-col>
      </v-row>

      <v-row>
        <v-col>
          <v-select
            :value="value.permissions"
            :items="permissionsItems"
            :label="$t('users.user.permissions')"
            prepend-icon="mdi-key"
            multiple
            hide-details
            @change="onFilterUpdate('permissions', $event)"
          >
            <template #selection="{ item }">
              <UserTagChip v-if="item.value" :tag="item.value" />
              <template v-else>
                {{ item.text }}
              </template>
            </template>
          </v-select>
        </v-col>
      </v-row>

      <v-row>
        <v-col>
          <v-select
            :value="value.roles"
            :items="rolesItems"
            :label="$t('users.user.roles')"
            prepend-icon="mdi-tag"
            multiple
            hide-details
            @change="onFilterUpdate('roles', $event)"
          >
            <template #selection="{ item }">
              <UserTagChip v-if="item.value" :tag="item.value" />
              <template v-else>
                {{ item.text }}
              </template>
            </template>
          </v-select>
        </v-col>
      </v-row>

      <v-row>
        <v-col>
          <v-select
            :value="value.institutions"
            :items="institutionItems"
            :label="$t('users.user.memberships')"
            prepend-icon="mdi-domain"
            multiple
            hide-details
            @change="onFilterUpdate('institutions', $event)"
          >
            <template #selection="{item}">
              <v-chip v-if="item.value" small>
                {{ item.text }}
              </v-chip>
              <template v-else>
                {{ item.text }}
              </template>
            </template>
          </v-select>
        </v-col>
      </v-row>
    </v-container>
  </v-navigation-drawer>
</template>

<script>
import UserTagChip from './UserTagChip.vue';

export default {
  components: {
    UserTagChip,
  },
  props: {
    value: {
      type: Object,
      required: true,
    },
    show: {
      type: Boolean,
      required: true,
    },
    search: {
      type: String,
      default: '',
    },
    institutions: {
      type: Array,
      default: () => [],
    },
    permissions: {
      type: Array,
      default: () => [],
    },
    roles: {
      type: Array,
      default: () => [],
    },
  },
  emits: ['input', 'update:show'],
  computed: {
    /**
     * Permissions list for v-select, with dynamic disabled state and no_permissions item
     */
    permissionsItems() {
      const isDisabled = this.value.permissions?.includes('');
      const permissions = this.permissions.map((p) => ({
        value: p,
        text: p,
        disabled: isDisabled,
      }));

      return [
        {
          // '' actually means: no permissions
          value: '',
          text: this.$t('users.user.no_permissions'),
          disabled: !isDisabled && this.value.permissions?.length > 0,
        },
        ...permissions,
      ];
    },
    /**
     * Roles list for v-select, with dynamic disabled state and no_roles item
     */
    rolesItems() {
      const isDisabled = this.value.roles?.includes('');
      const roles = this.roles.map((r) => ({
        value: r,
        text: r,
        disabled: isDisabled,
      }));

      return [
        {
          // '' actually means: no roles
          value: '',
          text: this.$t('users.user.no_roles'),
          disabled: !isDisabled && this.value.roles?.length > 0,
        },
        ...roles,
      ];
    },
    /**
     * Roles list for v-select, with dynamic disabled state, proper value/text
     * and no_institutions item
     */
    institutionItems() {
      const isDisabled = this.value.institutions?.includes('');
      const institutions = this.institutions.map((v) => ({
        value: v.id,
        text: v.acronym || v.name,
        disabled: isDisabled,
      }));

      return [
        {
          // '' actually means: no institution
          value: '',
          text: this.$t('users.user.no_institution'),
          disabled: !isDisabled && this.value.institutions?.length > 0,
        },
        ...institutions,
      ];
    },
  },
  methods: {
    onFilterUpdate(field, val) {
      const filters = { ...this.value };
      filters[field] = val;
      this.$emit('input', filters);
    },
    clearFilters() {
      this.$emit('input', {});
      this.$emit('update:show', false);
    },
  },
};
</script>

<style scoped>
.button-group-label {
  position: absolute !important;
  max-width: 133%;
  transform-origin: top left;
  transform: translateY(-16px) scale(.75);
}

.button-group-label + * {
  transform: translateY(5px)
}
</style>

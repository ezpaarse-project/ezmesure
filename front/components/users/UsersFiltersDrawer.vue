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
          <BooleanFilter
            :value="value.isAdmin"
            :label="$t('users.user.isAdmin')"
            :true-text="$t('yes')"
            :false-text="$t('no')"
            icon="mdi-security"
            @input="onFilterUpdate('isAdmin', $event)"
          />
        </v-col>
      </v-row>

      <v-row>
        <v-col>
          <SelectFilter
            :value="value.permissions"
            :items="permissionsItems"
            :label="$t('users.user.permissions')"
            icon="mdi-key"
            multiple
            @input="onFilterUpdate('permissions', $event)"
          >
            <template #selection="{ item }">
              <UserTagChip v-if="item.value" :tag="item.value" />
              <template v-else>
                {{ item.text }}
              </template>
            </template>
          </SelectFilter>
        </v-col>
      </v-row>

      <v-row>
        <v-col>
          <SelectFilter
            :value="value.roles"
            :items="rolesItems"
            :label="$t('users.user.roles')"
            icon="mdi-tag"
            multiple
            @input="onFilterUpdate('roles', $event)"
          >
            <template #selection="{ item }">
              <UserTagChip v-if="item.value" :tag="item.value" />
              <template v-else>
                {{ item.text }}
              </template>
            </template>
          </SelectFilter>
        </v-col>
      </v-row>

      <v-row>
        <v-col>
          <SelectFilter
            :value="value.institutions"
            :items="institutionItems"
            :label="$t('users.user.memberships')"
            icon="mdi-domain"
            multiple
            @input="onFilterUpdate('institutions', $event)"
          >
            <template #selection="{ item }">
              <v-chip v-if="item.value" small>
                {{ item.text }}
              </v-chip>
              <template v-else>
                {{ item.text }}
              </template>
            </template>

            <template #item="{ item, on, attrs }">
              <v-list-item v-bind="attrs" v-on="on">
                <v-list-item-title style="flex-basis: 300%;">
                  {{ item.text }}
                </v-list-item-title>
                <v-list-item-subtitle v-if="item.subtext">
                  {{ item.subtext }}
                </v-list-item-subtitle>
              </v-list-item>
            </template>
          </SelectFilter>
        </v-col>
      </v-row>
    </v-container>
  </v-navigation-drawer>
</template>

<script>
import UserTagChip from './UserTagChip.vue';
import SelectFilter from '../filters-form/SelectFilter.vue';
import BooleanFilter from '../filters-form/BooleanFilter.vue';

export default {
  components: {
    UserTagChip,
    SelectFilter,
    BooleanFilter,
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
      const permissions = this.permissions.map((p) => {
        const [feature, scope] = p.split(':');
        return {
          value: p,
          text: this.$t(`institutions.members.featureLabels.${feature}`),
          subtext: scope ? this.$t(`permissions.${scope}`) : '',
          disabled: isDisabled,
        };
      });

      return [
        {
          // '' actually means: no permissions
          value: '',
          text: this.$t('users.user.no_permissions'),
          disabled: !isDisabled && this.value.permissions?.length > 0,
        },
        ...permissions.sort((a, b) => a.value.localeCompare(b.value)),
      ];
    },
    /**
     * Roles list for v-select, with dynamic disabled state and no_roles item
     */
    rolesItems() {
      const isDisabled = this.value.roles?.includes('');
      const roles = this.roles.map((r) => ({
        value: r,
        text: this.$t(`institutions.members.roleNames.${r}`),
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
        text: v.name,
        subtext: v.acronym,
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

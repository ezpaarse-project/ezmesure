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
        {{ $t('users.filtersTitle') }}
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
            :value="value.fullName"
            :label="$t('users.user.fullName')"
            prepend-icon="mdi-account"
            hide-details
            @input="onFilterUpdate('fullName', $event)"
          />
        </v-col>

        <v-col>
          <v-text-field
            :value="value.username"
            :label="$t('users.user.username')"
            prepend-icon="mdi-account-outline"
            hide-details
            @input="onFilterUpdate('username', $event)"
          />
        </v-col>
      </v-row>

      <v-row>
        <v-col>
          <v-text-field
            :value="value.email"
            :label="$t('users.user.email')"
            prepend-icon="mdi-email"
            hide-details
            @input="onFilterUpdate('email', $event)"
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
            :items="permissions"
            :label="$t('users.user.permissions')"
            prepend-icon="mdi-key"
            multiple
            hide-details
            @change="onFilterUpdate('permissions', $event)"
          >
            <template #selection="{ item }">
              <UserTagChip :tag="item" />
            </template>
          </v-select>
        </v-col>
      </v-row>

      <v-row>
        <v-col>
          <v-select
            :value="value.roles"
            :items="roles"
            :label="$t('users.user.roles')"
            prepend-icon="mdi-tag"
            multiple
            hide-details
            @change="onFilterUpdate('roles', $event)"
          >
            <template #selection="{ item }">
              <UserTagChip :tag="item" />
            </template>
          </v-select>
        </v-col>
      </v-row>

      <v-row>
        <v-col>
          <v-select
            :value="value.institutions"
            :items="institutions"
            :label="$t('users.user.memberships')"
            :item-text="(v) => v.acronym || v.name"
            prepend-icon="mdi-domain"
            item-value="id"
            multiple
            small-chips
            hide-details
            @change="onFilterUpdate('institutions', $event)"
          />
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

<template>
  <v-list :loading="loading" subheader>
    <v-list-item>
      <v-text-field
        v-model="search"
        append-icon="mdi-magnify"
        :label="$t('search')"
        dense
        hide-details
        autocomplete="off"
        style="max-width: 200px"
        @input="debouncedQueryMemberships"
      />

      <v-spacer />

      <v-btn-toggle
        v-model="allValue"
        color="primary"
        dense
        rounded
        class="mr-4"
        @change="updateAllPermission($event)"
      >
        <v-btn
          v-for="permission in permissions"
          :key="permission.value"
          :value="permission.value"
          :disabled="memberships.length <= 0"
          small
          outlined
        >
          {{ permission.text }}
        </v-btn>
      </v-btn-toggle>
    </v-list-item>

    <v-divider />

    <v-virtual-scroll
      :items="memberships"
      height="300"
      item-height="81"
      bench="5"
    >
      <template #default="{ item }">
        <v-list-item :key="item.id">
          <v-list-item-content>
            <v-list-item-title>{{ item.user.fullName }}</v-list-item-title>

            <v-list-item-subtitle>{{ item.user.email }}</v-list-item-subtitle>

            <v-list-item-subtitle v-if="item.roles">
              <v-chip
                v-for="role in item.roles"
                :key="role"
                color="secondary"
                class="mr-1"
                x-small
                label
              >
                {{ $t(`institutions.members.roleNames.${role}`) }}
              </v-chip>
            </v-list-item-subtitle>
          </v-list-item-content>

          <v-list-item-action>
            <v-btn-toggle
              :value="valueMap[item.username]"
              color="primary"
              mandatory
              dense
              rounded
              @change="updatePermission(item.username, $event)"
            >
              <v-btn
                v-for="permission in permissions"
                :key="permission.value"
                :value="permission.value"
                small
                outlined
              >
                {{ permission.text }}
              </v-btn>
            </v-btn-toggle>
          </v-list-item-action>
        </v-list-item>
      </template>
    </v-virtual-scroll>
  </v-list>
</template>

<script>
import debounce from 'lodash.debounce';
import { defineComponent } from 'vue';

export default defineComponent({
  props: {
    value: {
      type: Array,
      required: true,
    },
    institutionId: {
      type: String,
      default: undefined,
    },
  },
  emits: ['input'],
  data: () => ({
    allValue: undefined,
    search: '',
    memberships: [],
  }),
  computed: {
    permissions() {
      return [
        { text: this.$t('permissions.none'), value: 'none' },
        { text: this.$t('permissions.read'), value: 'read' },
        { text: this.$t('permissions.write'), value: 'write' },
      ];
    },
    valueMap() {
      const map = {};

      // eslint-disable-next-line no-restricted-syntax
      for (const permission of this.value) {
        let level = 'write';
        if (permission.readonly) {
          level = 'read';
        }

        map[permission.username] = level;
      }

      return map;
    },
  },
  watch: {
    institutionId: {
      immediate: true,
      handler() {
        this.queryMemberships();
      },
    },
  },
  methods: {
    async queryMemberships() {
      if (!this.institutionId) {
        return;
      }

      this.loading = true;
      try {
        this.memberships = await this.$axios.$get(
          `/institutions/${this.institutionId}/memberships`,
          {
            params: {
              include: ['user'],
              sort: 'user.fullName',
              size: 0,
              q: this.search,
            },
          },
        );
      } catch (e) {
        this.$store.dispatch('snacks/error', this.$t('searchFailed'));
      }
      this.loading = false;
    },

    debouncedQueryMemberships: debounce(function debouncedQueryMemberships() {
      this.queryMemberships();
    }, 500),

    async updateAllPermission(value) {
      if (value === 'none') {
        this.$emit('input', []);
      } else if (value) {
        this.$emit(
          'input',
          this.memberships.map((p) => ({ username: p.user.username, readonly: value === 'read' })),
        );
      }

      // Reset state of "all" button
      await this.$nextTick();
      this.allValue = undefined;
    },

    updatePermission(username, value) {
      if (!value) {
        return;
      }

      if (value === 'none') {
        // Remove only if exists, cause v-on:change can be called when component is redrawn
        if (this.valueMap[username]) {
          this.$emit('input', this.value.filter((p) => p.username !== username));
        }
        return;
      }

      // Update only if changed, cause v-on:change can be called when component is redrawn
      if (this.valueMap[username] !== value) {
        this.$emit(
          'input',
          [...this.value, { username, readonly: value === 'read' }],
        );
      }
    },
  },
});
</script>

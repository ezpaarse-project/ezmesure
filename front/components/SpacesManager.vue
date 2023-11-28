<template>
  <v-card :loading="loading" v-bind="$attrs">
    <v-card-title class="headline">
      {{ $t('spaces.spaces') }}
      <v-spacer />

      <SpaceFormMenu
        :institution="institution"
        @space-created="addSpace"
      >
        <template #activator="{ on, attrs, saving }">
          <v-btn
            color="primary"
            text
            :loading="saving"
            v-bind="attrs"
            v-on="on"
          >
            <v-icon left>
              mdi-plus
            </v-icon>
            {{ $t('add') }}
          </v-btn>
        </template>
      </SpaceFormMenu>
    </v-card-title>

    <v-alert
      class="mx-4 my-2"
      type="error"
      dense
      outlined
      :value="!!errorMessage"
    >
      {{ errorMessage }}
    </v-alert>

    <v-container v-if="hasSpaces">
      <v-row>
        <v-col v-for="space in spaces" :key="space.id" cols="12">
          <SpaceCard :space="space">
            <template #actions>
              <v-spacer />

              <SpaceFormMenu
                :institution="institution"
                :space="space"
                @space-updated="(updatedSpace) => replaceSpace(space.id, updatedSpace)"
              >
                <template #activator="{ on, attrs, saving }">
                  <v-btn
                    :loading="saving"
                    small text
                    v-bind="attrs"
                    v-on="on"
                  >
                    <v-icon left>
                      mdi-pencil
                    </v-icon>
                    {{ $t('update') }}
                  </v-btn>
                </template>
              </SpaceFormMenu>

              <v-btn
                :loading="deleting[space.id]"
                small
                text
                @click="deleteSpace(space.id)"
              >
                <v-icon left>
                  mdi-delete
                </v-icon>
                {{ $t('delete') }}
              </v-btn>
            </template>
          </SpaceCard>
        </v-col>
      </v-row>
    </v-container>

    <v-card-text v-else class="text-center py-5">
      <v-progress-circular
        v-if="loading"
        indeterminate
        width="2"
      />
      <div v-else class="text-grey">
        {{ $t('spaces.noSpace') }}
      </div>
    </v-card-text>

    <slot name="actions" />

    <ConfirmDialog ref="confirmDialog" />
  </v-card>
</template>

<script>
import SpaceCard from '~/components/SpaceCard.vue';
import SpaceFormMenu from '~/components/SpaceFormMenu.vue';
import ConfirmDialog from '~/components/ConfirmDialog.vue';

export default {
  components: {
    ConfirmDialog,
    SpaceFormMenu,
    SpaceCard,
  },
  props: {
    institutionId: {
      type: String,
      default: () => '',
    },
  },
  data() {
    return {
      loading: false,
      deleting: {},

      institution: null,
      spaces: [],

      errorMessage: '',
    };
  },
  computed: {
    hasSpaces() {
      return Array.isArray(this.spaces) && this.spaces.length > 0;
    },
  },
  watch: {
    institutionId: {
      immediate: true,
      handler() { this.reset(); },
    },
  },
  methods: {
    reset() {
      this.spaces = [];
      this.deleting = {};
      this.errorMessage = '';
      this.refreshSpaces();
    },

    onChange() {
      this.$emit('change', this.spaces);
    },

    addSpace(newSpace) {
      this.spaces.push(newSpace);
      this.onChange();
    },

    replaceSpace(spaceId, updatedSpace) {
      this.spaces = this.spaces.map((space) => (
        (space?.id === spaceId) ? updatedSpace : space
      ));
      this.onChange();
    },

    async refreshSpaces() {
      if (!this.institutionId) { return; }

      this.loading = true;
      this.errorMessage = '';

      try {
        const [institution, spaces] = await Promise.all([
          this.$axios.$get(`/institutions/${this.institutionId}`),
          this.$axios.$get('/kibana-spaces', { params: { institutionId: this.institutionId } }),
        ]);

        this.institution = institution;
        this.spaces = spaces;
      } catch (e) {
        this.errorMessage = e?.response?.data?.error || this.$t('anErrorOccurred');
      }

      this.loading = false;
    },

    async deleteSpace(spaceId) {
      const spaceName = this.spaces.find((s) => s.id === spaceId)?.name || spaceId;
      const confirmed = await this.$refs.confirmDialog?.open({
        title: this.$t('areYouSure'),
        message: this.$t('spaces.deleteSpace', { spaceName }),
        agreeText: this.$t('delete'),
        agreeIcon: 'mdi-delete',
      });

      if (!confirmed) { return; }

      this.$set(this.deleting, spaceId, true);
      this.errorMessage = '';

      try {
        await this.$axios.$delete(`/kibana-spaces/${spaceId}`);
        this.spaces = this.spaces.filter((r) => r?.id !== spaceId);
        this.onChange();
      } catch (e) {
        this.errorMessage = e?.response?.data?.error || this.$t('anErrorOccurred');
      }

      this.$set(this.deleting, spaceId, false);
    },
  },
};
</script>

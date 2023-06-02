<template>
  <v-dialog
    v-model="show"
    scrollable
    width="600"
  >
    <v-card :loading="loading" class="fill-height">
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
              dark
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
            <SpaceCard :space="space" :namespace="institution.namespace">
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

                <ConfirmPopover
                  :message="$t('areYouSure')"
                  :agree-text="$t('delete')"
                  bottom
                  right
                  offset-y
                  @agree="deleteSpace(space.id)"
                >
                  <template #activator="{ on, attrs }">
                    <v-btn
                      :loading="deleting[space.id]"
                      small text
                      v-bind="attrs"
                      v-on="on"
                    >
                      <v-icon left>
                        mdi-delete
                      </v-icon>
                      {{ $t('delete') }}
                    </v-btn>
                  </template>
                </ConfirmPopover>
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
import SpaceCard from '~/components/SpaceCard.vue';
import SpaceFormMenu from '~/components/SpaceFormMenu.vue';
import ConfirmPopover from '~/components/ConfirmPopover.vue';

export default {
  components: {
    ConfirmPopover,
    SpaceFormMenu,
    SpaceCard,
  },
  data() {
    return {
      show: false,
      loading: false,
      hasChanged: false,
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
    show(visible) {
      if (!visible && this.hasChanged) {
        this.$emit('updated');
      }
    },
  },
  methods: {
    display(institution) {
      if (this.$refs.form) {
        this.$refs.form.resetValidation();
      }

      this.institution = institution;
      this.spaces = [];
      this.deleting = {};
      this.errorMessage = '';
      this.hasChanged = false;
      this.show = true;
      this.refreshSpaces();
    },

    addSpace(newSpace) {
      this.hasChanged = true;
      this.spaces.push(newSpace);
    },

    replaceSpace(spaceId, updatedSpace) {
      this.hasChanged = true;
      this.spaces = this.spaces.map((space) => (
        (space?.id === spaceId) ? updatedSpace : space
      ));
    },

    async refreshSpaces() {
      this.loading = true;
      this.errorMessage = '';

      try {
        this.spaces = await this.$axios.$get('/kibana-spaces', { params: { institutionId: this.institution.id } });
      } catch (e) {
        this.errorMessage = e?.response?.data?.error || this.$t('anErrorOccurred');
      }

      this.loading = false;
    },

    async deleteSpace(spaceId) {
      this.$set(this.deleting, spaceId, true);
      this.errorMessage = '';

      try {
        await this.$axios.$delete(`/kibana-spaces/${spaceId}`);
        this.spaces = this.spaces.filter((r) => r?.id !== spaceId);
        this.hasChanged = true;
      } catch (e) {
        this.errorMessage = e?.response?.data?.error || this.$t('anErrorOccurred');
      }

      this.$set(this.deleting, spaceId, false);
    },
  },
};
</script>

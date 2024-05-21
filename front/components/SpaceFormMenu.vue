<template>
  <v-menu
    v-model="show"
    :close-on-content-click="false"
    :nudge-width="200"
    offset-y
    bottom
    left
    @input="resetForm"
  >
    <template v-for="(_, slot) of $scopedSlots" #[slot]="scope">
      <slot :name="slot" v-bind="{ ...scope, saving }" />
    </template>

    <v-card :width="institution ? 1024 : undefined">
      <v-card-text>
        <v-row>
          <v-col>
            <v-alert
              type="error"
              dense
              outlined
              dismissible
              :value="!!errorMessage"
            >
              {{ errorMessage }}
            </v-alert>

            <v-form
              :id="formId"
              ref="spaceForm"
              v-model="formIsValid"
              @submit.prevent="saveSpace"
            >
              <v-select
                v-model="spaceType"
                :items="spaceTypes"
                :label="$t('type')"
                :disabled="editMode"
                outlined
                dense
                @change="applyPreset"
              />
              <v-text-field
                v-model="spaceId"
                :label="`${$t('identifier')} *`"
                :rules="[v => !!v || $t('fieldIsRequired')]"
                :disabled="editMode"
                :suffix="suffix"
                outlined
                autofocus
                required
                dense
                @input="applyPreset"
              />
              <v-text-field
                v-model="spaceName"
                :label="`${$t('name')} *`"
                :rules="[v => !!v || $t('fieldIsRequired')]"
                outlined
                required
                dense
              />
              <v-text-field
                v-model="spaceInitials"
                :label="$t('initials')"
                :rules="[v => !v || v.length <= 2 || $t('maxLength', { n: 2 })]"
                outlined
                dense
              />
              <v-textarea
                v-model="spaceDescription"
                :label="$t('description')"
                outlined
                dense
              />
            </v-form>
          </v-col>

          <v-col v-if="institution" cols="7">
            <v-expansion-panels :value="0" class="permission-expansion" accordion flat readonly>
              <v-expansion-panel>
                <v-expansion-panel-header hide-actions>
                  <div class="text-subtitle-2" style="vertical-align: bottom;">
                    <v-icon>mdi-account-lock</v-icon>

                    {{ $t('repositories.givePermissions') }}
                  </div>

                  <div class="text-right">
                    {{ $t('repositories.nPermissions', { count: permissions.length }) }}
                  </div>
                </v-expansion-panel-header>
                <v-expansion-panel-content>
                  <MembershipsPermissionBulk
                    v-model="permissions"
                    :institution-id="institution.id"
                  />
                </v-expansion-panel-content>
              </v-expansion-panel>
            </v-expansion-panels>
          </v-col>
        </v-row>
      </v-card-text>

      <v-card-actions>
        <v-spacer />

        <v-btn
          text
          @click="show = false"
        >
          {{ $t('cancel') }}
        </v-btn>
        <v-btn
          type="submit"
          :form="formId"
          color="primary"
          :loading="saving"
          :disabled="!formIsValid"
        >
          {{ $t(editMode ? 'update' : 'add') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-menu>
</template>

<script>
import MembershipsPermissionBulk from '~/components/institutions/MembershipsPermissionBulk.vue';

let counter = 0;

export default {
  components: {
    MembershipsPermissionBulk,
  },
  props: {
    institution: {
      type: Object,
      default: () => ({}),
    },
    space: {
      type: Object,
      default: () => ({}),
    },
  },
  data() {
    counter += 1;

    return {
      show: false,
      saving: false,
      formIsValid: false,

      formId: `space-form-${counter}`,
      errorMessage: '',

      spaceId: '',
      spaceType: 'ezpaarse',
      spaceName: '',
      spaceInitials: '',
      spaceDescription: '',

      permissions: [],
    };
  },
  computed: {
    editMode() {
      return !!this.space?.id;
    },
    spaceTypes() {
      return [
        { text: this.$t('spaces.types.ezpaarse'), value: 'ezpaarse' },
        { text: this.$t('spaces.types.counter5'), value: 'counter5' },
      ];
    },
    suffix() {
      return this.spaceType === 'ezpaarse' ? '-ezpaarse' : '-publisher';
    },
  },
  methods: {
    async resetForm() {
      this.$refs.spaceForm?.resetValidation?.();
      this.errorMessage = '';

      this.spaceType = this.space?.type || 'ezpaarse';
      this.spaceId = this.space?.id || '';
      this.spaceName = this.space?.name || '';
      this.spaceInitials = this.space?.initials || '';
      this.spaceDescription = this.space?.description || '';

      if (this.space?.id) {
        try {
          this.permissions = await this.$axios.$get(
            `/kibana-spaces/${this.space.id}/permissions`,
            { params: { size: 0 } },
          );
        } catch (e) {
          this.errorMessage = e?.response?.data?.error || this.$t('anErrorOccurred');
        }
      }
    },

    applyPreset() {
      const spaceDesc = this.$te(`spaces.descriptions.${this.spaceType}`)
        ? this.$t(`spaces.descriptions.${this.spaceType}`)
        : this.spaceType;
      this.spaceName = `${this.institution?.name} (${this.spaceType})`;
      this.spaceDescription = `${spaceDesc} (id: ${this.spaceId}${this.suffix})`;
    },

    async saveSpace() {
      this.saving = true;
      this.errorMessage = '';

      try {
        const { data: newSpace, status } = await this.$axios({
          method: this.editMode ? 'PATCH' : 'POST',
          url: this.editMode ? `/kibana-spaces/${this.space.id}` : '/kibana-spaces',
          data: {
            id: this.editMode ? undefined : `${this.spaceId}${this.suffix}`,
            type: this.spaceType,
            name: this.spaceName,
            initials: this.spaceInitials,
            description: this.spaceDescription,
            institutionId: this.institution?.id,
          },
        });

        if (this.institution) {
          await this.$axios.$put(
            `/kibana-spaces/${newSpace.id}/permissions`,
            this.permissions.map((permission) => ({
              username: permission.username,
              readonly: permission.readonly,
              locked: permission.locked,
            })),
          );
        }

        this.$emit(status === 201 ? 'space-created' : 'space-updated', newSpace);
        this.show = false;
      } catch (e) {
        this.errorMessage = e?.response?.data?.error || this.$t('anErrorOccurred');
      }

      this.saving = false;
    },
  },
};
</script>

<style scoped>
.permission-expansion {
  border: thin solid rgba(0,0,0,0.4);
}
.permission-expansion .v-expansion-panel-header {
  padding: 0 12px;
}
.permission-expansion::v-deep .v-expansion-panel-content__wrap {
  padding: 0;
}
</style>

<template>
  <v-dialog
    v-model="show"
    max-width="500px"
  >
    <v-card>
      <v-card-title>
        {{ $t('institutions.members.permissionsOf', { name: fullName }) }}
      </v-card-title>

      <v-card-text>
        <v-radio-group v-model="readonly">
          <v-radio
            :value="true"
            :label="$t('institutions.members.read')"
          />
          <v-radio
            :value="false"
            :label="`${$t('institutions.members.read')} / ${$t('institutions.members.write')}`"
          />
        </v-radio-group>

        <p v-if="readonly">
          {{ $t('institutions.members.readPermDesc') }}
        </p>
        <p v-else>
          {{ $t('institutions.members.writePermDesc') }}
        </p>

        <template v-if="isAdmin">
          <v-checkbox
            v-model="docContact"
            :label="$t('institutions.members.documentaryCorrespondent')"
            hide-details
          />
          <v-checkbox
            v-model="techContact"
            :label="$t('institutions.members.technicalCorrespondent')"
            hide-details
          />
        </template>

        <v-alert
          type="error"
          dense
          outlined
          :value="!!saveError"
          class="mt-4"
        >
          {{ saveError }}
        </v-alert>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn color="primary" :loading="saving" @click="save">
          <v-icon left>
            mdi-content-save
          </v-icon>
          {{ $t('save') }}
        </v-btn>
        <v-btn outlined @click="show = false">
          {{ $t('cancel') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  props: {
    institutionId: {
      type: String,
      default: () => '',
    },
  },
  data() {
    return {
      show: false,
      saving: false,
      saveError: null,
      username: '',
      fullName: '',
      readonly: true,
      docContact: false,
      techContact: false,
    };
  },
  computed: {
    isAdmin() {
      return this.$auth.hasScope('superuser') || this.$auth.hasScope('admin');
    },
  },
  methods: {
    updateMember(memberData = {}) {
      this.username = memberData?.username || '';
      this.fullName = memberData?.full_name || ''; // eslint-disable-line camelcase
      this.readonly = memberData?.readonly !== false;
      this.docContact = memberData?.docContact === true;
      this.techContact = memberData?.techContact === true;
      this.show = true;
    },

    async save() {
      if (!this.username || !this.institutionId) { return; }

      this.saving = true;
      this.saveError = null;

      const url = `/institutions/${this.institutionId}/members/${this.username}`;
      const body = {
        readonly: this.readonly,
        docContact: this.isAdmin ? this.docContact : undefined,
        techContact: this.isAdmin ? this.techContact : undefined,
      };

      try {
        await this.$axios.$put(url, body);
        this.show = false;
        this.$emit('updated');
      } catch (e) {
        const message = e?.response?.data?.error;
        this.saveError = message || this.$t('institutions.members.failedToUpdatePerms');
      }

      this.saving = false;
    },
  },
};
</script>

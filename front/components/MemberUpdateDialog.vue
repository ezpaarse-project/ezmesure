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
      username: '',
      fullName: '',
      readonly: true,
    };
  },
  methods: {
    updateMember(memberData = {}) {
      this.username = memberData?.username || '';
      this.fullName = memberData?.full_name || ''; // eslint-disable-line camelcase
      this.readonly = memberData?.readonly !== false;
      this.show = true;
    },

    async save() {
      if (!this.username || !this.institutionId) { return; }

      this.saving = true;

      const url = `/institutions/${this.institutionId}/members/${this.username}`;
      const body = { readonly: this.readonly };

      try {
        await this.$axios.$put(url, body);
        this.show = false;
        this.$emit('updated');
      } catch (e) {
        this.$store.dispatch('snacks/error', this.$t('institutions.members.failedToUpdatePerms'));
      }

      this.saving = false;
    },
  },
};
</script>

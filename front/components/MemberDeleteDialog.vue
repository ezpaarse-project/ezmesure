<template>
  <v-dialog
    v-model="show"
    max-width="400px"
  >
    <v-card>
      <v-card-title>
        {{ $t('areYouSure') }}
      </v-card-title>

      <v-card-text>
        {{ $t('institutions.members.removeFromMember', { name: member.fullName }) }}
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn color="primary" :loading="removing" @click="removeMember">
          <v-icon left>
            mdi-delete
          </v-icon>
          {{ $t('delete') }}
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
      removing: false,
      member: {
        username: '',
        fullName: '',
      },
    };
  },
  methods: {
    confirmRemove(memberData = {}) {
      this.member.username = memberData?.username || '';
      this.member.fullName = memberData?.full_name || ''; // eslint-disable-line camelcase
      this.show = true;
    },

    async removeMember() {
      if (!this.member.username || !this.institutionId) { return; }

      this.removing = true;

      try {
        await this.$axios.$delete(`/institutions/${this.institutionId}/members/${this.member.username}`);
        this.show = false;
        this.$emit('removed');
      } catch (e) {
        this.$store.dispatch('snacks/error', this.$t('institutions.members.failedToRemoveMember'));
      }

      this.removing = false;
    },
  },
};
</script>

<template>
  <v-dialog v-model="show" width="600">
    <v-card>
      <v-card-title class="headline">
        {{ memberForm.fullName }}
      </v-card-title>

      <v-card-text>
        <v-form id="memberForm" ref="form" v-model="valid" @submit.prevent="save">
          <v-container>
            <v-row>
              <v-col cols="12">
                <v-text-field
                  ref="email"
                  :value="memberForm.email"
                  :label="$t('institutions.members.email')"
                  type="email"
                  :rules="[
                    v => !!v || '',
                    v => /.+@.+\..+/.test(v) || $t('institutions.members.enterValidEmail'),
                  ]"
                  :placeholder="$t('institutions.members.emailExample')"
                  outlined
                  required
                  disabled
                />
              </v-col>

              <v-col cols="12">
                <p>
                  {{ $t('institutions.members.thisMemberIs') }}
                </p>
                <v-checkbox
                  v-model="memberForm.type"
                  :label="$t('institutions.members.technicalCorrespondent')"
                  hide-details
                  value="tech"
                />
                <v-checkbox
                  v-model="memberForm.type"
                  :label="$t('institutions.members.documentaryCorrespondent')"
                  hide-details
                  value="doc"
                />
              </v-col>
            </v-row>
          </v-container>
        </v-form>
      </v-card-text>

      <v-card-actions>
        <v-spacer />

        <v-btn text @click="show = false">
          {{ $t('close') }}
        </v-btn>

        <v-btn
          type="submit"
          form="memberForm"
          color="primary"
          text
          :disabled="!valid"
          :loading="saving"
        >
          {{ $t('update') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  data() {
    return {
      show: false,
      saving: false,
      institutionId: null,
      valid: false,

      memberForm: {
        id: null,
        fullName: '',
        email: '',
        type: [],
        confirmed: false,
      },
    };
  },
  methods: {
    editMember(institutionId, memberData = {}) {
      if (this.$refs.form) {
        this.$refs.form.resetValidation();
      }

      this.institutionId = institutionId;
      this.memberForm.id = memberData.id;
      this.memberForm.email = memberData.email || '';
      this.memberForm.fullName = memberData.fullName || '';
      this.memberForm.type = memberData.type || [];
      this.memberForm.confirmed = !!memberData.confirmed;
      this.memberForm.id = memberData.id;
      this.show = true;
    },

    async save() {
      this.saving = true;

      try {
        await this.$axios.$patch(`/institutions/${this.institutionId}/members/${this.memberForm.email}`, this.memberForm);
        this.$emit('update');
      } catch (e) {
        this.$store.dispatch('snacks/error', this.$t('formSendingFailed'));
        this.saving = false;
        return;
      }

      this.$store.dispatch('snacks/success', this.$t('institutions.members.updated'));
      this.saving = false;
      this.show = false;
    },
  },
};
</script>

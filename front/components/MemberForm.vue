<template>
  <v-dialog v-model="show" width="600">
    <v-card>
      <v-card-title class="headline" v-text="memberForm.fullName" />

      <v-card-text>
        <v-form id="memberForm" ref="form" v-model="valid" @submit.prevent="save">
          <v-container>
            <v-row>
              <v-col cols="12">
                <v-text-field
                  ref="email"
                  :value="memberForm.email"
                  label="Adresse email *"
                  type="email"
                  :rules="[
                    v => !!v || '',
                    v => /.+@.+\..+/.test(v) || 'Veuillez saisir un email valide.',
                  ]"
                  placeholder="ex: john@doe.fr"
                  outlined
                  required
                  disabled
                />
              </v-col>

              <v-col cols="12">
                <p>Ce membre est un correspondant :</p>
                <v-checkbox
                  v-model="memberForm.type"
                  label="Technique"
                  hide-details
                  value="tech"
                />
                <v-checkbox
                  v-model="memberForm.type"
                  label="Documentaire"
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
          Fermer
        </v-btn>

        <v-btn
          type="submit"
          form="memberForm"
          color="primary"
          text
          :disabled="!valid"
          :loading="saving"
        >
          Mettre à jour
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
        this.$store.dispatch('snacks/error', 'L\'envoi du formulaire a échoué');
        this.saving = false;
        return;
      }

      this.$store.dispatch('snacks/success', 'Membre mis à jour');
      this.saving = false;
      this.show = false;
    },
  },
};
</script>

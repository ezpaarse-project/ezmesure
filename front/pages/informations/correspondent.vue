<template>
  <section>
    <ToolBar title="Informations: Correspondant" />
    <v-card-text>
      <v-form
        ref="form"
        v-model="valid"
        :lazy-validation="lazy"
      >
        <v-container>
          <v-row>
            <v-col cols="12">
              <span v-for="(contact, key) in establishment.contacts" :key="key">
                <v-text-field
                  v-if="contact.email === user.email"
                  ref="email"
                  v-model="establishment.contacts[key].email"
                  label="Adresse email *"
                  type="email"
                  :rules="[
                    v => !!v || '',
                    v => /.+@.+\..+/.test(v) || 'Veuillez saisir un email valide.',
                  ]"
                  placeholder="ex: john@doe.fr"
                  outlined
                  required
                  :disabled="establishment.contacts[key].email.length > 0"
                />
              </span>
            </v-col>

            <v-col cols="12">
              <p>Je souhaite être désigné(e) correspondant :</p>
              <span v-for="(contact, key) in establishment.contacts" :key="key">
                <v-checkbox
                  v-if="contact.email === user.email"
                  v-model="establishment.contacts[key].type"
                  label="Technique"
                  hide-details
                  value="tech"
                />
                <v-checkbox
                  v-if="contact.email === user.email"
                  v-model="establishment.contacts[key].type"
                  label="Documentaire"
                  hide-details
                  value="doc"
                />
              </span>
            </v-col>
          </v-row>
        </v-container>
      </v-form>
    </v-card-text>
    <v-card-actions>
      <span class="caption">* champs obligatoires</span>
      <v-spacer />
      <v-btn
        color="primary"
        @click="save"
      >
        Sauvegarder
      </v-btn>
    </v-card-actions>
  </section>
</template>

<script>
import ToolBar from '~/components/space/ToolBar';

export default {
  layout: 'space',
  middleware: ['auth', 'terms'],
  components: {
    ToolBar,
  },
  data() {
    return {
      valid: true,
      lazy: false,
      formData: new FormData(),
    };
  },
  async fetch({ store }) {
    await store.dispatch('getEstablishment');
  },
  computed: {
    user() { return this.$auth.user; },
    establishment: {
      get() { return this.$store.state.establishment; },
      set(newVal) { this.$store.dispatch('setEstablishment', newVal); },
    },
  },
  methods: {
    save() {
      this.$refs.form.validate();

      this.formData.append('form', JSON.stringify(this.establishment));

      this.$store.dispatch('storeOrUpdateEstablishment', this.formData)
        .then(() => {
          this.$store.dispatch('snacks/success', 'Informations transmises');
          this.formData = new FormData();
        })
        .catch(() => this.$store.dispatch('snacks/error', 'L\'envoi du forumlaire a échoué'));
    },
  },
};
</script>

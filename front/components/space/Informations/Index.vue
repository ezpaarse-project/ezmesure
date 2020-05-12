<template>
  <section>
    <v-tabs v-model="activeTab" grow>
      <v-tab to="#tab-establishment" router>
        Établissement
      </v-tab>
      <v-tab to="#tab-correspondant" router>
        Correspondent
      </v-tab>
      <v-tab to="#tab-sushi" router>
        Sushi
      </v-tab>
    </v-tabs>

    <v-tabs-items v-model="activeTab">
      <v-tab-item id="tab-establishment">
        <Establishment
          :establishment="establishment"
          :logo="logo"
          :logo-preview="logoPreview"
          @upload="upload"
          @removeLogo="removeLogo"
          @save="save"
        />
      </v-tab-item>

      <v-tab-item id="tab-correspondant">
        <Correspondant
          :establishment="establishment"
          @save="save"
        />
      </v-tab-item>

      <v-tab-item id="tab-sushi">
        <Sushi
          :establishment="establishment"
          @save="save"
        />
      </v-tab-item>
    </v-tabs-items>
  </section>
</template>

<script>
/* eslint-disable vue/no-side-effects-in-computed-properties */

import Establishment from '~/components/space/Informations/Establishment';
import Correspondant from '~/components/space/Informations/Correspondant';
import Sushi from '~/components/space/Informations/Sushi';

export default {
  components: {
    Establishment,
    Correspondant,
    Sushi,
  },
  data() {
    return {
      activeTab: 'tab-establishment',
      logo: null,
      logoPreview: null,
      formData: new FormData(),
    };
  },
  async fetch({ store, redirect, route }) {
    await store.dispatch('auth/checkAuth');
    const { user } = store.state.auth;

    const isAdmin = user.roles.find(role => role === 'admin');
    const isTester = user.roles.find(role => role === 'tester');

    if (!user) {
      redirect('/authenticate', { origin: route.fullPath });
    } else if (!user.metadata.acceptedTerms) {
      redirect('/terms');
    } else if (!isAdmin || !isTester) {
      redirect('/myspace');
    }
  },
  computed: {
    user() { return this.$store.state.auth.user; },
    establishment: {
      get() {
        if (this.$store.state.establishment) {
          this.logoPreview = this.$store.state.establishment.organisation.logoUrl;
        }
        return this.$store.state.establishment;
      },
      set(newVal) { this.$store.dispatch('setEstablishment', newVal); },
    },
  },
  methods: {
    upload(logo, logoPreview) {
      this.logo = logo;
      this.logoPreview = logoPreview;
    },
    removeLogo() {
      this.logoPreview = null;
      this.logo = null;
    },
    save() {
      this.formData.append('logo', this.logo);
      this.formData.append('form', JSON.stringify(this.establishment));

      this.$store.dispatch('storeOrUpdateEstablishment', this.formData)
        .then(() => {
          this.$store.dispatch('snacks/success', 'Informations transmises');
          this.formData = new FormData();
          this.$refs.form.resetValidation();
        })
        .catch(() => this.$store.dispatch('snacks/error', 'L\'envoi du forumlaire a échoué'));
    },
  },
};
</script>

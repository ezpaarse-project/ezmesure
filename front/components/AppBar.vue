<template>
  <v-app-bar app fixed dark color="primary">
    <router-link
      to="/"
      aria-label="Page d'accueil ezMESURE"
      title="Page d'accueil ezMESURE"
    >
      <v-img
        alt="Logo ezMESURE"
        src="/images/logo.png"
        contain
        transition="scale-transition"
        height="38px"
        width="38px"
      />
    </router-link>

    <v-toolbar-title class="ml-3">
      ezMESURE
    </v-toolbar-title>

    <v-spacer />

    <v-toolbar-items class="hidden-sm-and-down">
      <v-btn text exact to="/">
        Accueil
      </v-btn>
      <v-btn text href="/kibana/">
        Tableaux de bord
      </v-btn>
      <v-btn text to="/myspace">
        Mon compte
      </v-btn>
      <v-btn text exact to="/partners">
        Nos partenaires
      </v-btn>
      <v-btn text exact to="/api-reference">
        API
      </v-btn>
      <v-btn text exact to="/contact-us">
        Contact
      </v-btn>
    </v-toolbar-items>

    <v-bottom-sheet v-model="sheet">
      <template v-slot:activator="{ on }">
        <v-btn class="hidden-md-and-up" icon dark v-on="on">
          <v-icon>mdi-menu</v-icon>
        </v-btn>
      </template>

      <v-list>
        <v-subheader>Naviguer vers</v-subheader>

        <v-list-item exact to="/" @click="sheet = false">
          <v-list-item-title>Accueil</v-list-item-title>
        </v-list-item>
        <v-list-item href="/kibana/" @click="sheet = false">
          <v-list-item-title>Tableaux de bord</v-list-item-title>
        </v-list-item>
        <v-list-item exact to="/myspace" @click="sheet = false">
          <v-list-item-title>Mon compte</v-list-item-title>
        </v-list-item>
        <v-list-item exact to="/partners" @click="sheet = false">
          <v-list-item-title>Nos partenaires</v-list-item-title>
        </v-list-item>
        <v-list-item exact to="/api-reference" @click="sheet = false">
          <v-list-item-title>API</v-list-item-title>
        </v-list-item>
        <v-list-item exact to="/contact-us" @click="sheet = false">
          <v-list-item-title>Contact</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-bottom-sheet>
  </v-app-bar>
</template>

<script>
export default {
  data() {
    return {
      sheet: false,
    };
  },
};
</script>

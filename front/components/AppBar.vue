<template>
  <v-toolbar app fixed dark>
    <v-toolbar-title>
      ezMESURE - Plateforme des tableaux de bord ezPAARSE de l’ESR
    </v-toolbar-title>
    <v-spacer/>
    <v-toolbar-items class="hidden-xs-only">
      <v-btn flat exact to="/">Accueil</v-btn>
      <v-btn flat href="/kibana/">Tableaux de bord</v-btn>
      <v-btn flat exact to="/myspace">Mon espace</v-btn>
      <v-btn flat exact to="/partners">Nos partenaires</v-btn>
    </v-toolbar-items>

    <v-bottom-sheet v-model="sheet" class="hidden-sm-and-up">
      <v-btn slot="activator" icon dark>
        <v-icon>menu</v-icon>
      </v-btn>
      <v-list>
        <v-subheader>Naviguer vers</v-subheader>

        <v-list-tile @click="sheet = false" exact to="/">
          <v-list-tile-title>Accueil</v-list-tile-title>
        </v-list-tile>
        <v-list-tile @click="sheet = false" href="/kibana/">
          <v-list-tile-title>Tableaux de bord</v-list-tile-title>
        </v-list-tile>
        <v-list-tile @click="sheet = false" exact to="/myspace">
          <v-list-tile-title>Profil</v-list-tile-title>
        </v-list-tile>
        <v-list-tile @click="sheet = false" exact to="/partners">
          <v-list-tile-title>Nos partenaires</v-list-tile-title>
        </v-list-tile>
      </v-list>
    </v-bottom-sheet>
  </v-toolbar>
</template>

<script>
export default {
  data () {
    return {
      sheet: false
    }
  }
}
</script>


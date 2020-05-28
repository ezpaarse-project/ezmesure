<template>
  <v-navigation-drawer
    v-model="drawer"
    app
    clipped
    fixed
    color="grey lighten-3"
    width="256"
  >
    <v-list v-model="item" nav>
      <v-list-item
        v-for="link in links"
        :key="link.title"
        router
        :to="{ path: link.href }"
      >
        <v-list-item-content>
          <v-list-item-title class="grey--text text--darken-3 uppercase">
            {{ link.title }}
          </v-list-item-title>
        </v-list-item-content>
      </v-list-item>

      <v-list-group
        :value="$nuxt.$route.name.indexOf(informations.title.toLowerCase()) !== -1"
      >
        <template v-slot:activator>
          <v-list-item-title
            class="grey--text text--darken-3 uppercase"
            v-text="informations.title"
          />
        </template>

        <v-list-item
          v-for="child in informations.children"
          :key="child.title"
          router
          :to="{ path: `${informations.href}${child.href}` }"
          ripple
        >
          <v-list-item-title
            class="grey--text text--darken-3 uppercase pl-5"
            v-text="child.title"
          />
        </v-list-item>
      </v-list-group>

      <v-list-group
        v-if="administration.admin && isAdmin"
        :value="$nuxt.$route.name.indexOf(administration.title.toLowerCase()) !== -1"
      >
        <template v-slot:activator>
          <v-list-item-title
            class="grey--text text--darken-3 uppercase"
            v-text="administration.title"
          />
        </template>

        <v-list-item
          v-for="child in administration.children"
          :key="child.title"
          router
          :to="{ path: `${administration.href}${child.href}` }"
          ripple
        >
          <v-list-item-title
            class="grey--text text--darken-3 uppercase pl-5"
            v-text="child.title"
          />
        </v-list-item>
      </v-list-group>
    </v-list>

    <template v-slot:append>
      <div class="pa-2">
        <v-btn block color="red lighten-2" dark>
          Déconnexion
        </v-btn>
      </div>
    </template>
  </v-navigation-drawer>
</template>

<script>
export default {
  data() {
    return {
      item: 1,
      links: [
        { title: 'Profil', href: '/myspace' },
        { title: 'Mes dépots', href: '/files' },
        { title: 'Identifiants Kibana', href: '/kibana' },
        { title: 'Token d\'authentification', href: '/token' },
      ],
      administration: {
        title: 'Administration',
        href: '/administration',
        admin: true,
        children: [
          {
            title: 'Établissements',
            href: '/establishments',
          },
          {
            title: 'Sushi',
            href: '/sushi',
          },
          {
            title: 'Utilisateurs',
            href: '/users',
          },
        ],
      },
      informations: {
        title: 'Informations',
        href: '/informations',
        children: [
          {
            title: 'Établissement',
            href: '/establishment',
          },
          {
            title: 'Correspondant',
            href: '/correspondent',
          },
          {
            title: 'Sushi',
            href: '/sushi',
          },
        ],
      },
    };
  },
  computed: {
    drawer: {
      get() { return this.$store.state.drawer; },
      set(newVal) { this.$store.dispatch('SET_DRAWER', newVal); },
    },
    user() { return this.$auth.user; },
    hasRoles() { return Array.isArray(this.user.roles) && this.user.roles.length > 0; },
    isAdmin() {
      if (this.user && this.hasRoles) {
        return this.user.roles.some(role => ['admin', 'superuser'].includes(role));
      }
      return false;
    },
  },
};
</script>

<style>
.uppercase {
  text-transform: uppercase !important;
  font-size: 0.8rem !important;
  font-weight: 500 !important;
}
</style>

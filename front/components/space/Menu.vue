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
        v-if="institutionMenu"
        :value="$nuxt.$route.name.includes(institutionMenu.title.toLowerCase())"
      >
        <template v-slot:activator>
          <v-list-item-title
            class="grey--text text--darken-3 uppercase"
            v-text="institutionMenu.title"
          />
        </template>

        <v-list-item
          v-for="child in institutionMenu.children"
          :key="child.title"
          router
          exact
          :to="{ path: `${institutionMenu.href}${child.href}` }"
          ripple
        >
          <v-list-item-title
            class="grey--text text--darken-3 uppercase pl-5"
            v-text="child.title"
          />
        </v-list-item>
      </v-list-group>

      <v-list-group
        v-if="isAdmin"
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
          exact
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
        <v-btn
          block
          color="red lighten-2"
          dark
          href="/Shibboleth.sso/Logout?return=/logout"
          v-text="$t('menu.logout')"
        />
      </div>
    </template>
  </v-navigation-drawer>
</template>

<script>
export default {
  data() {
    return {
      item: 1,
      institution: null,
    };
  },
  computed: {
    links() {
      return [
        { title: this.$t('menu.profile'), href: '/myspace' },
        { title: this.$t('menu.myDeposits'), href: '/files' },
        { title: this.$t('menu.kibanIdentifiers'), href: '/kibana' },
        { title: this.$t('menu.authentificationToken'), href: '/token' },
      ];
    },
    administration() {
      return {
        title: this.$t('menu.administration'),
        href: '/admin',
        children: [
          {
            title: this.$t('menu.institutions'),
            href: '/institutions',
          },
        ],
      };
    },
    institutionMenu() {
      if (!this.canAccessSushi && !this.canAccessInstitution) {
        return null;
      }

      const menuGroup = {
        title: this.$t('menu.myInstitution'),
        href: '/institutions',
        children: [],
      };

      if (this.canAccessInstitution) {
        menuGroup.children.push({
          title: this.$t('menu.profile'),
          href: '/self',
        });
      }

      if (this.canAccessMembers) {
        menuGroup.children.push({
          title: this.$t('menu.members'),
          href: '/self/members',
        });
      }

      if (this.canAccessSushi) {
        menuGroup.children.push({
          title: this.$t('menu.sushi'),
          href: '/self/sushi',
        });
      }

      return menuGroup;
    },
    drawer: {
      get() { return this.$store.state.drawer; },
      set(newVal) { this.$store.dispatch('SET_DRAWER', newVal); },
    },
    userRoles() {
      const roles = this.$auth?.user?.roles;
      return Array.isArray(roles) ? roles : [];
    },
    isAdmin() {
      return this.userRoles.some(role => ['admin', 'superuser'].includes(role));
    },
    isContact() {
      return this.userRoles.some(role => ['doc_contact', 'tech_contact'].includes(role));
    },
    canAccessInstitution() {
      return this.isAdmin || this.institutionFeatureEnabled;
    },
    canAccessMembers() {
      return this.canAccessInstitution && this.isInstitutionContact;
    },
    canAccessSushi() {
      if (this.isAdmin) { return true; }

      if (!this.institution?.validated) { return false; }
      if (!this.sushiFeatureEnabled) { return false; }
      if (!this.isInstitutionContact) { return false; }

      return true;
    },
    institutionFeatureEnabled() {
      return this.userRoles.includes('institution_form');
    },
    sushiFeatureEnabled() {
      return this.userRoles.includes('sushi_form');
    },
    isInstitutionContact() {
      if (!this.institution?.role) { return false; }
      if (!this.isContact) { return false; }

      return this.userRoles.includes(this.institution.role);
    },
  },

  async mounted() {
    if (!this.institutionFeatureEnabled && !this.sushiFeatureEnabled) { return; }

    try {
      this.institution = await this.$axios.$get('/institutions/self');
    } catch (e) {
      if (e.response?.status !== 404) {
        this.$store.dispatch('snacks/error', this.$t('institutions.unableToRetriveInformations'));
      }
    }
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

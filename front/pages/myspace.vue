<template>
  <section>
    <ToolBar title="Mon Profil">
      <slot>
        <v-spacer />

        <v-btn text :href="refreshUrl">
          <v-icon left>
            mdi-refresh
          </v-icon>
          Actualiser
        </v-btn>
      </slot>
    </ToolBar>

    <v-card-text>
      <v-alert
        type="info"
        prominent
        :value="!hasRoles"
      >
        <div class="headline">
          Aucun rôle n'est encore associé à votre compte.
        </div>
        <div>
          Afin de déterminer vos droits d'accès, nous vous invitons à contacter l'équipe
          ou le correspondant ezMESURE de votre établissement.
        </div>
      </v-alert>
      <v-text-field
        :value="user.full_name"
        label="Nom"
        readonly
        outlined
      />

      <v-text-field
        :value="user.email"
        label="Mail"
        readonly
        outlined
      />

      <v-text-field
        :value="metadata.idp"
        label="IDP"
        readonly
        outlined
      />

      <v-text-field
        :value="metadata.org"
        label="Organisation"
        readonly
        outlined
      />

      <v-text-field
        :value="metadata.unit"
        label="Unité"
        readonly
        outlined
      />

      <v-card v-if="hasRoles" outlined>
        <v-card-text>
          <div class="title">
            Vos rôles
          </div>
          <div class="mb-2">
            Ces rôles définissent vos droits d'accès aux données
            et aux tableaux de bord hébergés sur ezMESURE.
          </div>
          <div>
            <v-chip
              v-for="role in user.roles"
              :key="role"
              class="mr-2"
              label
              outlined
              color="accent"
            >
              {{ role }}
            </v-chip>
          </div>
        </v-card-text>
      </v-card>
    </v-card-text>
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
    const currentLocation = encodeURIComponent(window.location.href);

    return {
      refreshUrl: `/login?refresh=1&origin=${currentLocation}`,
    };
  },
  computed: {
    drawer: {
      get() { return this.$store.state.drawer; },
      set(newVal) { this.$store.dispatch('SET_DRAWER', newVal); },
    },
    user() { return this.$auth.user; },
    metadata() { return (this.user && this.user.metadata) || {}; },
    hasRoles() { return Array.isArray(this.user.roles) && this.user.roles.length > 0; },
  },
};
</script>

<template>
  <v-container>
    <template v-if="user">
      <v-tabs v-model="activeTab" show-arrows grow dark>
        <v-tab to="#tab-profile" router>
          Profil
        </v-tab>
        <v-tab to="#tab-files" router>
          Mes dépôts
        </v-tab>
        <v-tab to="#tab-kibana" router>
          Identifiants Kibana
        </v-tab>
        <v-tab to="#tab-token" router>
          Token d'authentification
        </v-tab>
      </v-tabs>

      <v-card>
        <v-tabs-items v-model="activeTab">
          <v-tab-item id="tab-profile">
            <v-card-text>
              <div class="mb-3">
                <div class="grey--text">
                  Nom
                </div>
                <div>{{ user.full_name }}</div>
              </div>

              <div class="mb-3">
                <div class="grey--text">
                  Mail
                </div>
                <div>{{ user.email }}</div>
              </div>

              <div class="mb-3">
                <div class="grey--text">
                  IDP
                </div>
                <div>{{ metadata.idp }}</div>
              </div>

              <div class="mb-3">
                <div class="grey--text">
                  Organisation
                </div>
                <div>{{ metadata.org }}</div>
              </div>

              <div class="mb-3">
                <div class="grey--text">
                  Unité
                </div>
                <div>{{ metadata.unit }}</div>
              </div>

              <p class="text-xs-right">
                <v-btn small :href="refreshUrl">
                  <v-icon left>
                    refresh
                  </v-icon>
                  Actualiser
                </v-btn>
              </p>
            </v-card-text>
          </v-tab-item>

          <v-tab-item id="tab-files">
            <v-tabs v-model="activeFilesTab" grow>
              <v-tab href="#tab-files-list">
                Liste
              </v-tab>
              <v-tab href="#tab-files-upload">
                Déposer
              </v-tab>
            </v-tabs>

            <v-tabs-items v-model="activeFilesTab">
              <v-tab-item id="tab-files-list">
                <FileList ref="filelist" />
              </v-tab-item>

              <v-tab-item id="tab-files-upload">
                <FileUploader :on-upload="refreshFileList" />
              </v-tab-item>
            </v-tabs-items>
          </v-tab-item>

          <v-tab-item id="tab-kibana">
            <v-card-text>
              <p>
                Ce nom d'utilisateur vous permet de vous connecter à l'interface
                Kibana afin d'accéder à vos tableaux de bord.
              </p>

              <v-text-field v-model="user.username" label="Nom d'utilisateur" readonly />

              <v-alert v-model="passwordError" dismissible color="error">
                {{ passwordErrorText }}
              </v-alert>
              <v-alert v-model="resetSuccess" dismissible color="success">
                Un nouveau mot de passe vous a été envoyé par mail.
              </v-alert>
              <p>
                Pour changer votre mot de passe,
                accédez à votre<a href="/kibana/app/kibana#/account">compte Kibana</a>.
              </p>
              <p>
                Mot de passe oublié ?
                <a href="javascript:void(0)" @click="resetPassword">Cliquez-ici</a>
                pour le réinitialiser.
              </p>
            </v-card-text>
          </v-tab-item>

          <v-tab-item id="tab-token">
            <v-card-text>
              <p>
                Ce token est nécessaire pour utiliser l'API d'ezMESURE.
                Pour l'utiliser, ajoutez le header suivant à vos requêtes HTTP :
                <code>Authorization: Bearer {insérez le token ici}</code>
              </p>

              <p class="text-xs-center">
                <v-btn v-if="!showToken" @click="showToken = true">
                  <v-icon left>
                    visibility
                  </v-icon>
                  Afficher mon token
                </v-btn>
              </p>

              <v-text-field v-if="showToken" v-model="token" label="Token" textarea readonly />
            </v-card-text>
          </v-tab-item>
        </v-tabs-items>
      </v-card>
    </template>

    <v-card v-else>
      <v-card-text>
        <p>Vous n'êtes <strong>pas</strong> authentifié.</p>
        <p><a :href="redirectUrl">Cliquez ici</a> pour vous connecter.</p>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script>
import FileList from '~/components/FileList';
import FileUploader from '~/components/FileUploader';

export default {
  components: {
    FileList,
    FileUploader,
  },
  async fetch({ store, redirect }) {
    await store.dispatch('auth/checkAuth');
    const { user } = store.state.auth;

    if (user && !user.metadata.acceptedTerms) {
      redirect('/terms');
    }
  },
  data() {
    const currentLocation = encodeURIComponent(window.location.href);

    return {
      activeTab: 'tab-profile',
      activeFilesTab: 'tab-files-list',
      showToken: false,
      resetSuccess: false,
      passwordError: null,
      passwordErrorText: '',
      redirectUrl: `/login?origin=${currentLocation}`,
      refreshUrl: `/login?refresh=1&origin=${currentLocation}`,
    };
  },
  computed: {
    user() { return this.$store.state.auth.user; },
    metadata() { return (this.user && this.user.metadata) || {}; },
    token() { return this.$store.state.auth.token; },
  },
  methods: {
    refreshFileList() {
      this.$refs.filelist.refreshFiles();
    },

    async resetPassword() {
      this.passwordError = null;
      this.resetSuccess = false;

      try {
        await this.$store.dispatch('auth/resetPassword');
        this.resetSuccess = true;
      } catch (e) {
        this.passwordError = true;
        if (e.response.status >= 400 && e.response.status < 500) {
          this.passwordErrorText = e.response.body;
        } else if (e.response.statusText) {
          this.passwordErrorText = e.response.statusText;
        } else {
          this.passwordErrorText = e.message;
        }
      }
    },
  },
};
</script>

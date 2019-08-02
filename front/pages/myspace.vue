<template>
  <v-container>
    <v-card class="mx-auto" max-width="1400">
      <v-tabs
        v-model="activeTab"
        show-arrows
        :vertical="$vuetify.breakpoint.mdAndUp"
        color="primary"
        background-color="grey lighten-3"
      >
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

        <v-tabs-items v-model="activeTab">
          <v-tab-item id="tab-profile">
            <v-toolbar dense flat>
              <v-toolbar-title>
                Profil
              </v-toolbar-title>

              <v-spacer />

              <v-btn text :href="refreshUrl">
                <v-icon left>
                  mdi-refresh
                </v-icon>
                Actualiser
              </v-btn>
            </v-toolbar>

            <v-card flat class="mx-auto" max-width="800px">
              <v-card-text>
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
              </v-card-text>
            </v-card>
          </v-tab-item>

          <v-tab-item id="tab-files">
            <v-toolbar v-if="nbSelectedFiles === 0" dense flat>
              <v-toolbar-title>
                Mes dépôts
              </v-toolbar-title>

              <v-spacer />

              <v-btn text @click="refreshFileList">
                <v-icon left>
                  mdi-refresh
                </v-icon>
                Actualiser
              </v-btn>
            </v-toolbar>

            <v-toolbar v-else dense flat dark>
              <v-btn icon @click="deselectFiles">
                <v-icon>mdi-close</v-icon>
              </v-btn>

              <v-toolbar-title>
                {{ nbSelectedFiles }} sélectionné(s)
              </v-toolbar-title>

              <v-spacer />

              <v-btn text @click="deleteSelectedFiles">
                <v-icon left>
                  mdi-delete
                </v-icon>
                Supprimer
              </v-btn>
            </v-toolbar>

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
                <FileList ref="filelist" @select="selectedFiles = $event" />
              </v-tab-item>

              <v-tab-item id="tab-files-upload">
                <FileUploader @upload="refreshFileList" />
              </v-tab-item>
            </v-tabs-items>
          </v-tab-item>

          <v-tab-item id="tab-kibana">
            <v-toolbar v-if="nbSelectedFiles === 0" dense flat>
              <v-toolbar-title>
                Identifiants Kibana
              </v-toolbar-title>

              <v-spacer />

              <v-btn text @click="showPasswordReset = true">
                <v-icon left>
                  mdi-lock-question
                </v-icon>
                Mot de passe oublié
              </v-btn>
            </v-toolbar>

            <v-card flat class="mx-auto" max-width="800px">
              <v-card-text>
                <p>
                  Ce nom d'utilisateur vous permet de vous connecter à l'interface
                  Kibana afin d'accéder à vos tableaux de bord.
                  Pour changer votre mot de passe,
                  accédez à votre <a href="/kibana/app/kibana#/account">compte Kibana</a>.
                </p>

                <v-text-field
                  :value="user.username"
                  append-icon="mdi-account"
                  label="Nom d'utilisateur"
                  readonly
                  outlined
                />
              </v-card-text>
            </v-card>

            <v-dialog v-model="showPasswordReset" width="500">
              <v-card>
                <v-toolbar
                  color="primary"
                  dark
                  flat
                  dense
                >
                  <v-toolbar-title>Mot de passe oublié</v-toolbar-title>
                  <v-spacer />
                  <v-icon>mdi-lock-question</v-icon>
                </v-toolbar>

                <v-card-text>
                  <v-alert
                    :value="resetError"
                    dismissible
                    prominent
                    dense
                    type="error"
                  >
                    {{ resetErrorText }}
                  </v-alert>
                  <v-alert
                    :value="resetSuccess"
                    dismissible
                    prominent
                    dense
                    type="success"
                  >
                    Un nouveau mot de passe vous a été envoyé par mail.
                  </v-alert>

                  Vous ne vous souvenez plus de votre mot de passe ?
                  Cliquez sur <code>réinitialiser</code> pour en recevoir un nouveau par mail.
                </v-card-text>

                <v-divider />

                <v-card-actions>
                  <v-spacer />
                  <v-btn text @click="showPasswordReset = false">
                    Fermer
                  </v-btn>
                  <v-btn
                    color="primary"
                    text
                    :loading="resettingPassword"
                    @click="resetPassword"
                  >
                    Réinitialiser
                  </v-btn>
                </v-card-actions>
              </v-card>
            </v-dialog>
          </v-tab-item>

          <v-tab-item id="tab-token">
            <v-toolbar dense flat>
              <v-toolbar-title>
                Token d'authentification
              </v-toolbar-title>
            </v-toolbar>

            <v-card flat class="mx-auto" max-width="800px">
              <v-card-text>
                <p>
                  Ce token est nécessaire pour utiliser l'API d'ezMESURE.
                  Pour l'utiliser, ajoutez le header suivant à vos requêtes HTTP :
                  <code>Authorization: Bearer {insérez le token ici}</code>
                </p>

                <v-container grid-list-md class="px-0">
                  <v-layout row align-center>
                    <v-flex grow>
                      <v-text-field
                        ref="token"
                        label="Token"
                        :value="token"
                        :rules="[() => ('The email and password you entered don\'t match')]"
                        hide-details
                        readonly
                        outlined
                        :type="showToken ? 'text' : 'password'"
                        :append-icon="showToken ? 'mdi-eye-off' : 'mdi-eye'"
                        @click:append="() => (showToken = !showToken)"
                      />
                    </v-flex>

                    <v-flex v-if="clipboardAvailable" shrink>
                      <v-btn text @click="copyTokenToClipboard">
                        <v-icon left>
                          mdi-clipboard-text
                        </v-icon>
                        Copier
                      </v-btn>
                    </v-flex>
                  </v-layout>
                </v-container>
              </v-card-text>
            </v-card>
          </v-tab-item>
        </v-tabs-items>
      </v-tabs>
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
  async fetch({ store, redirect, route }) {
    await store.dispatch('auth/checkAuth');
    const { user } = store.state.auth;

    if (!user) {
      redirect('/authenticate', { origin: route.fullPath });
    } else if (!user.metadata.acceptedTerms) {
      redirect('/terms');
    }
  },
  data() {
    const currentLocation = encodeURIComponent(window.location.href);

    return {
      activeTab: 'tab-profile',
      activeFilesTab: 'tab-files-list',
      showToken: false,
      showPasswordReset: false,
      resettingPassword: false,
      resetSuccess: false,
      resetError: null,
      resetErrorText: '',
      refreshUrl: `/login?refresh=1&origin=${currentLocation}`,
      selectedFiles: [],
    };
  },
  computed: {
    user() { return this.$store.state.auth.user; },
    metadata() { return (this.user && this.user.metadata) || {}; },
    token() { return this.$store.state.auth.token; },
    nbSelectedFiles() { return this.selectedFiles.length; },
    clipboardAvailable() {
      return navigator && navigator.clipboard && typeof navigator.clipboard.writeText === 'function';
    },
  },
  methods: {
    async copyTokenToClipboard() {
      try {
        await navigator.clipboard.writeText(this.token);
      } catch (e) {
        this.$store.dispatch('snacks/error', 'La copie du token a échoué');
        return;
      }
      this.$store.dispatch('snacks/info', 'Token copié dans le presse papier');
    },

    refreshFileList() {
      this.$refs.filelist.refreshFiles();
    },

    deleteSelectedFiles() {
      this.$refs.filelist.deleteSelected();
    },

    deselectFiles() {
      this.$refs.filelist.deselectAll();
    },

    async resetPassword() {
      this.resetError = null;
      this.resetSuccess = false;
      this.resettingPassword = true;

      try {
        await this.$store.dispatch('auth/resetPassword');
        this.resetSuccess = true;
      } catch (e) {
        this.resetError = true;
        if (e.response.status >= 400 && e.response.status < 500) {
          this.resetErrorText = e.response.body;
        } else if (e.response.statusText) {
          this.resetErrorText = e.response.statusText;
        } else {
          this.resetErrorText = e.message;
        }
      }

      this.resettingPassword = false;
    },
  },
};
</script>

<template>
  <section>
    <ToolBar title="Administration: Sushi">
      <slot>
        <v-spacer />

        <v-btn text @click="refreshInstitutions">
          <v-icon left>
            mdi-refresh
          </v-icon>
          Actualiser
        </v-btn>
      </slot>
    </ToolBar>
    <v-data-table
      v-model="selected"
      :headers="headers"
      :items="institutions"
      :expanded.sync="expanded"
      item-key="id"
      show-select
      show-expand
    >
      <template v-slot:expanded-item="{ headers, item }">
        <td :colspan="headers.length" class="px-5 py-5">
          <v-btn
            v-for="(sushi, key) in item.sushi"
            :key="key"
            :ref="key"
            color="primary"
            dark
            class="ma-1"
            @click.stop="edit(item, key)"
            v-text="item.sushi[key].vendor"
          />
        </td>
      </template>

      <template v-slot:item.count="{ item }">
        {{ item.sushi.length || 0 }}
      </template>

      <template v-slot:footer>
        <span v-if="selected.length">
          <v-btn small color="error" class="ma-2" @click="deleteData">
            <v-icon left>mdi-delete</v-icon>
            Supprimer ({{ selected.length }})
          </v-btn>
        </span>
      </template>
    </v-data-table>

    <v-dialog v-model="dialog" width="600">
      <v-card>
        <v-card-title class="headline" v-text="sushiData.vendor" />

        <v-card-text>
          <v-form
            ref="form"
            v-model="valid"
            :lazy-validation="lazy"
          >
            <v-container>
              <v-row>
                <v-col cols="12">
                  <v-text-field
                    v-model="sushiData.vendor"
                    label="Libellé *"
                    :rules="[v => !!v || 'Veuillez saisir un libellé.']"
                    outlined
                    required
                  />
                </v-col>

                <v-col cols="12">
                  <v-text-field
                    v-model="sushiData.sushiUrl"
                    label="URL Sushi *"
                    :rules="[v => !!v || 'Veuillez saisir une url.']"
                    outlined
                    required
                  />
                </v-col>

                <v-col cols="6">
                  <v-text-field
                    v-model="sushiData.requestorId"
                    label="Requestor Id *"
                    :rules="[v => !!v || 'Veuillez saisir un Requestor Id.']"
                    outlined
                    required
                  />
                </v-col>

                <v-col cols="6">
                  <v-text-field
                    v-model="sushiData.customerId"
                    label="Customer Id *"
                    :rules="[v => !!v || 'Veuillez saisir un Customer Id.']"
                    outlined
                  />
                </v-col>

                <v-col cols="12">
                  <v-text-field
                    v-model="sushiData.apiKey"
                    label="Clé API"
                    outlined
                  />
                </v-col>

                <v-col cols="12">
                  <v-textarea
                    v-model="sushiData.comment"
                    label="Commentaire"
                    outlined
                  />
                </v-col>
              </v-row>
            </v-container>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-btn
            color="red"
            text
            :loading="loading.delete"
            @click.stop="deleteSushiData"
          >
            Supprimer
          </v-btn>

          <v-spacer />

          <v-btn text @click="dialog = false">
            Fermer
          </v-btn>

          <v-btn
            color="primary"
            text
            :loading="loading.update"
            @click="update"
          >
            Mettre à jour
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </section>
</template>

<script>
import ToolBar from '~/components/space/ToolBar';

export default {
  layout: 'space',
  middleware: ['auth', 'terms', 'isAdmin'],
  components: {
    ToolBar,
  },
  data() {
    return {
      selected: [],
      expanded: [],
      current: [],
      sushiData: [],
      institutions: [],
      valid: false,
      lazy: false,
      loading: {
        delete: false,
        update: false,
      },
      dialog: false,
      headers: [
        { text: 'Etablissement', value: 'name' },
        { text: 'Identifiants', value: 'count' },
        { text: '', value: 'data-table-expand' },
      ],
      headersSushi: [
        { text: 'Plateforme', value: 'vendor' },
        { text: '', value: 'data-table-expand' },
      ],
    };
  },
  mounted() {
    return this.refreshInstitutions();
  },
  methods: {
    async refreshInstitutions() {
      let institutions;
      try {
        institutions = await this.$axios.$get('/correspondents/list');
      } catch (e) {
        this.$store.dispatch('snacks/error', 'Impossible de récupérer les informations d\'établissement');
      }

      if (!Array.isArray(institutions)) {
        institutions = [];
      }

      const hasSushi = item => Array.isArray(item.sushi) && item.sushi.length > 0;
      this.institutions = institutions.filter(hasSushi);
    },
    edit(platform, key) {
      this.dialog = true;
      this.current = platform;
      this.sushiData = platform.sushi[key];
    },
    async deleteSushiData() {
      this.loading.delete = true;
      const removeCurrentSushiData = credentials => credentials.id !== this.sushiData.id;
      this.current.sushi = this.current.sushi.filter(removeCurrentSushiData);
      try {
        await this.save('delete');
      } finally {
        this.loading.delete = false;
      }
    },
    update() {
      this.loading.update = true;
      this.save('update');
    },
    async save(loading) {
      this.loading[loading] = true;

      const formData = new FormData();
      formData.append('form', JSON.stringify(this.current));

      try {
        await this.$axios.$post('/correspondents/', formData);
      } catch (e) {
        this.$store.dispatch('snacks/error', 'L\'envoi du formulaire a échoué');
        this.loading[loading] = false;
        this.dialog = false;
        return;
      }

      this.$store.dispatch('snacks/success', 'Informations transmises');
      this.loading[loading] = false;
      this.dialog = false;
    },
  },
};
</script>

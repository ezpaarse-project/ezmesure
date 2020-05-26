<template>
  <section>
    <ToolBar title="Administration: Sushi">
      <slot>
        <v-spacer />

        <v-btn text @click="refreshAdminData">
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
      :items="establishments"
      :expanded.sync="expanded"
      item-key="id"
      show-select
      show-expand
    >
      <template v-slot:expanded-item="{ headers, item }">
        <td :colspan="headers.length" class="px-5 py-5">
          <v-row justify="center">
            <v-expansion-panels accordion>
              <v-expansion-panel
                v-for="(sushi, i) in item.sushi"
                :key="i"
              >
                <v-expansion-panel-header expand-icon="mdi-chevron-down">
                  {{ sushi.vendor }}
                </v-expansion-panel-header>
                <v-expansion-panel-content>
                  <v-form ref="form">
                    <v-container>
                      <v-row>
                        <v-col cols="12">
                          <v-text-field
                            v-model="sushi.vendor"
                            label="Libellé *"
                            :rules="[v => !!v || 'Veuillez saisir un libellé.']"
                            outlined
                            required
                          />
                        </v-col>

                        <v-col cols="12">
                          <v-text-field
                            v-model="sushi.sushiUrl"
                            label="URL Sushi *"
                            :rules="[v => !!v || 'Veuillez saisir une url.']"
                            outlined
                            required
                          />
                        </v-col>

                        <v-col cols="6">
                          <v-text-field
                            v-model="sushi.requestorId"
                            label="Requestor Id *"
                            :rules="[v => !!v || 'Veuillez saisir un Requestor Id.']"
                            outlined
                            required
                          />
                        </v-col>

                        <v-col cols="6">
                          <v-text-field
                            v-model="sushi.customerId"
                            label="Customer Id *"
                            :rules="[v => !!v || 'Veuillez saisir un Customer Id.']"
                            outlined
                          />
                        </v-col>

                        <v-col cols="12">
                          <v-text-field
                            v-model="sushi.apiKey"
                            label="Clé API"
                            outlined
                          />
                        </v-col>

                        <v-col cols="12">
                          <v-textarea
                            v-model="sushi.comment"
                            label="Commentaire"
                            outlined
                          />
                        </v-col>
                      </v-row>
                    </v-container>
                  </v-form>
                </v-expansion-panel-content>
              </v-expansion-panel>
            </v-expansion-panels>
          </v-row>
        </td>
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
      selectedSushi: [],
      expanded: [],
      expandedSushi: [],
      headers: [
        { text: 'Etablissement', value: 'organisation.name' },
        { text: '', value: 'data-table-expand' },
      ],
      headersSushi: [
        { text: 'Plateforme', value: 'vendor' },
        { text: '', value: 'data-table-expand' },
      ],
    };
  },
  computed: {
    establishments: {
      get() {
        return this.$store.state.establishments.filter((establishment) => {
          if (!establishment.sushi.length) return false;
          return true;
        });
      },
      set(newVal) { this.$store.dispatch('SET_ESTABLISHMENT', newVal); },
    },
  },
  methods: {
    refreshAdminData() {
      this.$store.dispatch('getEstablishments');
    },
  },
};
</script>

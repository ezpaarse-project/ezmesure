<template>
  <v-layout
    id="footer"
    row
    wrap
    align-center
    justify-center
    align-content-end
  >
    <v-flex xs12>
      <v-footer padless color="primary" min-height="68px">
        <v-container fluid>
          <v-layout
            row
            wrap
            fill-height
            align-center
            class="px-5"
          >
            <v-flex
              xs12
              sm12
              md6
              lg6
              xl6
              :class="`white--text ${textCenter ? 'text-center': ''}`"
            >
              <strong>ezMESURE</strong> &copy; {{ new Date().getFullYear() }}
              <v-tooltip top>
                <template v-slot:activator="{ on, attrs }">
                  <a
                    v-bind="attrs"
                    href="https://github.com/ezpaarse-project/ezmesure"
                    target="_blank"
                    v-on="on"
                  >
                    <v-icon color="white" class="mx-2">
                      mdi-github
                    </v-icon>
                  </a>
                </template>
                <span v-text="$t('github')" />
              </v-tooltip>
              <v-tooltip top>
                <template v-slot:activator="{ on, attrs }">
                  <a
                    v-bind="attrs"
                    href="https://twitter.com/ezpaarse"
                    target="_blank"
                    v-on="on"
                  >
                    <v-icon color="white" class="mx-2">
                      mdi-twitter
                    </v-icon>
                  </a>
                </template>
                <span v-text="$t('twitter')" />
              </v-tooltip>
              <v-tooltip top>
                <template v-slot:activator="{ on, attrs }">
                  <a
                    v-bind="attrs"
                    href="mailto:ezteam@couperin.org"
                    target="_blank"
                    v-on="on"
                  >
                    <v-icon color="white" class="mx-2">
                      mdi-email-edit-outline
                    </v-icon>
                  </a>
                </template>
                <span v-text="$t('mailto')" />
              </v-tooltip>
              <v-tooltip top>
                <template v-slot:activator="{ on, attrs }">
                  <a
                    v-bind="attrs"
                    href="https://www.youtube.com/channel/UCcR-0UE9WjYiwS4fMG2T4tQ"
                    target="_blank"
                    v-on="on"
                  >
                    <v-icon color="white" class="mx-2">
                      mdi-youtube
                    </v-icon>
                  </a>
                </template>
                <span v-text="$t('youtube')" />
              </v-tooltip>
            </v-flex>
            <v-flex xs12 sm12 md6 lg6 xl6 :class="`text-${textCenter ? 'center': 'right'}`">
              <v-btn
                text
                tile
                class="white--text"
                to="/legales-notices"
                v-text="$t('menu.legalNotices')"
              />
              <v-btn
                text
                tile
                class="white--text"
                to="/privacy"
                v-text="$t('menu.privacy')"
              />
              <v-btn
                text
                tile
                class="white--text"
                to="/api-reference"
                v-text="$t('menu.api')"
              />
            </v-flex>
          </v-layout>
        </v-container>
      </v-footer>
    </v-flex>
  </v-layout>
</template>

<script>
export default {
  computed: {
    textCenter() {
      if (['xs', 'sm'].includes(this.$vuetify.breakpoint.name)) {
        return 'center';
      }
      return false;
    },
  },
};
</script>

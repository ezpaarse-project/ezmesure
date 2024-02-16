<template>
  <section>
    <ToolBar :title="$t('token.title')" />
    <v-card-text class="w-800 mx-auto">
      <i18n path="token.whatDoesToken.text" tag="p">
        <template #header>
          <code>{{ $t('token.whatDoesToken.header') }}</code>
        </template>
      </i18n>

      <v-container grid-list-md class="px-0">
        <v-layout row align-center>
          <v-flex grow>
            <v-text-field
              ref="token"
              :label="$t('token.token')"
              :value="token"
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
              {{ $t('copy') }}
            </v-btn>
          </v-flex>
        </v-layout>
      </v-container>
    </v-card-text>
  </section>
</template>

<script>
import ToolBar from '~/components/space/ToolBar.vue';

export default {
  layout: 'space',
  middleware: ['auth', 'terms'],
  components: {
    ToolBar,
  },
  data() {
    return {
      showToken: false,
      token: '',
    };
  },
  computed: {
    clipboardAvailable() {
      return navigator && navigator.clipboard && typeof navigator.clipboard.writeText === 'function';
    },
  },
  async mounted() {
    try {
      this.token = await this.$axios.$get('/profile/token');
    } catch (e) {
      this.$store.dispatch('snacks/error', this.$t('token.unableToRetriveToken'));
    }
  },
  methods: {
    async copyTokenToClipboard() {
      try {
        await navigator.clipboard.writeText(this.token);
      } catch (e) {
        this.$store.dispatch('snacks/error', this.$t('token.copyFailed'));
        return;
      }
      this.$store.dispatch('snacks/info', this.$t('token.clipped'));
    },
  },
};
</script>

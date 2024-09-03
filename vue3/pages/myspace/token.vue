<template>
  <div>
    <SkeletonPageBar :title="$t('token.title')" />

    <v-container>
      <v-row>
        <v-col>
          <i18n-t keypath="token.whatDoesToken.text" tag="p">
            <template #header>
              <code class="v-code">{{ $t('token.whatDoesToken.header') }}</code>
            </template>
          </i18n-t>
        </v-col>
      </v-row>

      <v-row>
        <v-col>
          <v-text-field
            :label="$t('token.token')"
            :model-value="token"
            :type="showToken ? 'text' : 'password'"
            :append-inner-icon="showToken ? 'mdi-eye-off' : 'mdi-eye'"
            variant="outlined"
            hide-details
            readonly
            @click:append-inner="() => (showToken = !showToken)"
          >
            <template v-if="clipboard" #append>
              <v-btn variant="text" @click="copyTokenToClipboard">
                <v-icon left>
                  mdi-clipboard-text
                </v-icon>
                {{ $t('copy') }}
              </v-btn>
            </template>
          </v-text-field>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'space',
  middleware: ['auth', 'terms'],
});

const { t } = useI18n();
const { isSupported: clipboard, copy } = useClipboard();
const snacks = useSnacksStore();

const { data: token } = await useFetch('/api/profile/token');

const showToken = ref(false);

async function copyTokenToClipboard() {
  if (!token.value) {
    return;
  }

  try {
    await copy(token.value);
  } catch (e) {
    snacks.error(t('clipboard.unableToCopy'));
    return;
  }
  snacks.info(t('clipboard.textCopied'));
}
</script>

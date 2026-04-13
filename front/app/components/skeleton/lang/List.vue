<template>
  <v-list>
    <v-list-item
      v-for="lang in locales"
      :key="lang.code"
      :title="lang.name"
      @click="changeLocale(lang.code)"
    >
      <template #prepend>
        <img
          :src="`/images/lang/${lang.code}.png`"
          :alt="lang.name"
          width="24"
          class="mr-2"
        >
      </template>
    </v-list-item>
  </v-list>
</template>

<script setup>
import locales from '@/lib/locales';

const { t, setLocale } = useI18n();
const { status } = useAuth();
const snacks = useSnacksStore();

const changeLocale = async (lang) => {
  setLocale(lang);

  if (status === 'authenticated') {
    try {
      await $fetch('/api/profile/language', {
        method: 'PUT',
        body: { value: lang },
      });
    } catch (err) {
      snacks.error(t('anErrorOccurred'), err);
    }
  }
};
</script>

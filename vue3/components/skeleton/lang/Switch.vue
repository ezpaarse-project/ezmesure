<template>
  <v-menu v-model="isOpen" location="bottom">
    <template #activator="{ props }">
      <v-btn
        :append-icon="isOpen ? 'mdi-chevron-up' : 'mdi-chevron-down'"
        :text="currentLang"
        v-bind="props"
      />
    </template>

    <SkeletonLangList />
  </v-menu>
</template>

<script setup>
import locales from '@/lib/locales';

const { t, locale } = useI18n();

const isOpen = ref(false);

const currentLang = computed(() => locales.find((lang) => lang.code === locale.value)?.name || t('language'));
</script>

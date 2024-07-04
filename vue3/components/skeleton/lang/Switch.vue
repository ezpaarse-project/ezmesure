<template>
  <v-menu v-model="isOpen" location="bottom">
    <template #activator="{ props }">
      <v-btn v-bind="props">
        {{ currentLang }}
        <v-icon :icon="isOpen ? 'mdi-chevron-up' : 'mdi-chevron-down'" end />
      </v-btn>
    </template>

    <SkeletonLangList />
  </v-menu>
</template>

<script setup lang="ts">
import locales from '@/config/locales';

const { t, locale } = useI18n();

const isOpen = ref(false);

const currentLang = computed(() => locales.find((lang) => lang.code === locale.value)?.name || t('language'));
</script>

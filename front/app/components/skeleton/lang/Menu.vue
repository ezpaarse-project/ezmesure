<template>
  <v-menu v-model="isOpen">
    <template #activator="{ props }">
      <slot name="activator" :current-lang="currentLang" :is-open="isOpen" :props="props" />
    </template>

    <SkeletonLangList />
  </v-menu>
</template>

<script setup>
import locales from '@/lib/locales';

const { t, locale } = useI18n();

const isOpen = shallowRef(false);

const currentLang = computed(() => locales.find((lang) => lang.code === locale.value)?.name || t('language'));
</script>

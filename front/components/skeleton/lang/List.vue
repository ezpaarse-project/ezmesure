<template>
  <v-list>
    <v-list-item
      v-for="lang in locales"
      :key="lang.code"
      :title="lang.name"
      @click="setLocale(lang.code)"
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

const { setLocale } = useI18n();
</script>

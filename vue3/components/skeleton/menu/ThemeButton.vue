<template>
  <div class="pa-2 text-center">
    <v-btn small text icon @click="updateTheme">
      <v-tooltip activator="parent" location="top">
        <span v-if="theme.global.current.value.dark" v-text="t('theme.light')" />
        <span v-else v-text="t('theme.dark')" />
      </v-tooltip>
      <v-icon v-if="theme.global.current.value.dark">
        mdi-white-balance-sunny
      </v-icon>
      <v-icon v-else>
        mdi-weather-night
      </v-icon>
    </v-btn>
  </div>
</template>

<script setup>

const { t } = useI18n()

import { useTheme } from 'vuetify'

const theme = useTheme()

function updateTheme() {
  theme.global.name.value = theme.global.current.value.dark ? 'light' : 'dark'
}

</script>
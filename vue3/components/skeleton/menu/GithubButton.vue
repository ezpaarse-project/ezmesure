<template>
  <div class="text-center ma-2">
    <v-btn small :href="githubProfile" target="_blank" rel="noreferrer"
      variant="outlined">
      Version: {{ version }}
      <v-icon right>
        mdi-github
      </v-icon>
    </v-btn>
  </div>
</template>

<script setup>

import { ref } from 'vue';

const runtimeConfig = useRuntimeConfig()

const version = ref(runtimeConfig.public.version);
const githubProfile = ref(runtimeConfig.public.githubProfileURL);

</script>
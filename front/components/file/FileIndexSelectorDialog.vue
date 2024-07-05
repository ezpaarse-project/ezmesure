<template>
  <v-menu
    v-model="show"
    :close-on-content-click="false"
    nudge-top="15"
    max-width="350"
    bottom
    offset-y
  >
    <template #activator="binds">
      <slot name="activator" v-bind="binds" :display="display" />
    </template>

    <v-card>
      <v-card-title>
        {{ $t('files.selectIndex') }}

        <v-spacer />

        <v-btn icon @click="close()">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text>
        {{ $t('files.selectIndexDescription') }}

        <v-select
          v-model="choice"
          :label="$t('files.affectedIndex')"
          :items="indices"
          hide-details
        />
      </v-card-text>

      <v-card-actions>
        <v-spacer />

        <v-btn :disabled="!choice" color="primary" @click="close(choice)">
          {{ $t('validate') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-menu>
</template>

<script setup>
import { ref } from 'vue';

const emit = defineEmits(['update:modelValue']);

const show = ref(false);
const indices = ref([]);
const choice = ref('');

const display = (indicesToChoose) => {
  show.value = true;
  indices.value = indicesToChoose.map((i) => i.name);
};

const close = (value = '') => {
  show.value = false;
  emit('update:modelValue', value);
};
</script>

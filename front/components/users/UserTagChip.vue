<template>
  <v-chip
    :color="style.background"
    small
    class="mr-1 mb-1"
    :style="{ color: style.color }"
  >
    {{ tag }}
  </v-chip>
</template>

<script>
import chroma from 'chroma-js';

const scopeColors = {};

export default {
  props: {
    tag: {
      type: String,
      required: true,
    },
  },
  computed: {
    style() {
      if (!this.tag) {
        return {};
      }

      const [scope] = this.tag.split(':', 2);
      if (!scopeColors[scope]) {
        // https://stackoverflow.com/a/3426956
        let hash = 0;
        for (let i = 0; i < scope.length; i += 1) {
          // eslint-disable-next-line no-bitwise
          hash = scope.charCodeAt(i) + ((hash << 5) - hash);
        }
        // eslint-disable-next-line no-bitwise
        const color = (hash & 0x00FFFFFF).toString(16).toUpperCase();
        const background = '#00000'.substring(0, 7 - color.length) + color;
        scopeColors[scope] = {
          background,
          color: chroma.contrast(background, 'black') < 5 ? 'white' : 'black',
        };
      }

      return scopeColors[scope];
    },
  },
};
</script>

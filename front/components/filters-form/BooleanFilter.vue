<template>
  <v-input
    :prepend-icon="icon"
    hide-details
    style="padding-top: 12px; margin-top: 4px;"
  >
    <v-label v-if="label" class="button-group-label">
      {{ label }}
    </v-label>

    <v-btn-toggle
      :value="value"
      dense
      rounded
      color="primary"
      @change="$emit('input', $event)"
    >
      <v-btn :value="true" small outlined>
        {{ trueText }}
      </v-btn>

      <v-btn :value="false" small outlined>
        {{ falseText }}
      </v-btn>
    </v-btn-toggle>
  </v-input>
</template>

<script>
import { defineComponent } from 'vue';

export default defineComponent({
  props: {
    value: {
      type: Boolean,
      default: undefined,
    },
    trueText: {
      type: String,
      default: 'true',
    },
    falseText: {
      type: String,
      default: 'false',
    },
    label: {
      type: String,
      default: undefined,
    },
    icon: {
      type: String,
      default: undefined,
    },
  },
  emits: {
    input: (val) => val != null,
  },
});
</script>

<style scoped>
.button-group-label {
  position: absolute !important;
  max-width: 133%;
  transform-origin: top left;
  transform: translateY(-16px) scale(.75);
}

.button-group-label + * {
  transform: translateY(5px)
}
</style>

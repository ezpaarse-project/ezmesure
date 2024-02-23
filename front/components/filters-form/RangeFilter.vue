<template>
  <div>
    <v-label v-if="label" :class="['slider-label', icon && 'slider-label-withicon']">
      {{ label }}
    </v-label>

    <v-range-slider
      :value="range"
      :min="0"
      :max="max"
      :color="color"
      hide-details
      thumb-label
      @end="range = $event"
    >
      <template #prepend>
        <v-icon v-if="icon" class="mr-2">
          {{ icon }}
        </v-icon>
        <v-text-field
          :value="range[0]"
          :min="0"
          class="mt-0 pt-0"
          hide-details
          single-line
          type="number"
          style="width: 60px"
          @change="range = [+$event, range[1]]"
        />
      </template>

      <template #append>
        <v-text-field
          :value="range[1]"
          :min="0"
          class="mt-0 pt-0"
          hide-details
          single-line
          type="number"
          style="width: 60px"
          @change="range = [range[0], +$event]"
        />
      </template>
    </v-range-slider>
  </div>
</template>

<script>
import { defineComponent } from 'vue';

export default defineComponent({
  props: {
    value: {
      type: Array,
      default: () => undefined,
    },
    label: {
      type: String,
      default: undefined,
    },
    icon: {
      type: String,
      default: undefined,
    },
    color: {
      type: String,
      default: undefined,
    },
    max: {
      type: Number,
      default: 0,
    },
  },
  emits: {
    input: (v) => !!v,
  },
  computed: {
    range: {
      get() {
        return this.partialToRange(this.value, this.max);
      },
      set(val) {
        this.updateValue(val, this.max);
      },
    },
  },
  methods: {
    /**
     * Transform a partial range into a full one
     *
     * @param {[number | undefined, number | undefined] | undefined} val The partial range
     * @param {number} max The maximum value of the range
     *
     * @returns {[number, number]}
     */
    partialToRange(val, max) {
      return [
        val?.[0] ?? 0,
        val?.[1] ?? max,
      ];
    },
    /**
     * Update a value with a partial range
     *
     * @param {[number | undefined, number | undefined] | undefined} val The partial range
     * @param {number} max The maximum value of the range
     */
    updateValue(val, max) {
      if (
        !val
        || (val[0] === 0 && val[1] === max)
      ) {
        this.$emit('input', undefined);
        return;
      }

      this.$emit('input', this.partialToRange(val, max));
    },
  },
});
</script>

<style scoped>
.slider-label {
  position: absolute !important;
  max-width: 133%;
  transform-origin: top left;
  transform: translateY(-16px) scale(.75);
  left: 16px !important;
  top: 16px;
}

.slider-label.slider-label-withicon {
  left: 44px !important;
  top: 22px;
}

.slider-label + *::v-deep(.v-slider) {
  transform: translateY(5px)
}
</style>

<template>
  <div
    class="progress-container"
    :style="{ width: size && `${size}px`, height: size && `${size}px` }"
  >
    <v-progress-circular
      v-for="{ key, ...progress } in loaders"
      :key="`progress-${key}`"
      v-bind="progress"
    />

    <div class="label-container">
      <slot
        name="labels"
        :labels="labelsToShow"
      >
        <div v-for="label in labelsToShow" :key="`label-${label.key}`">
          <slot
            name="label"
            :label="label"
          >
            <div :class="label.color && `text-${label.color}`">
              <slot
                :name="`label.${label.key}`"
                :value="label.value"
              >
                {{ label.value }}
              </slot>
            </div>
          </slot>
        </div>
      </slot>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  value: {
    type: Array,
    required: true,
  },
  labels: {
    type: Array,
    default: () => undefined,
  },
  size: {
    type: [String, Number],
    default: undefined,
  },
  width: {
    type: [String, Number],
    default: undefined,
  },
  showEmpty: {
    type: Boolean,
    default: false,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  loaderColor: {
    type: String,
    default: 'primary',
  },
});

const loaders = computed(() => {
  if (props.loading) {
    return [
      {
        key: '__loading',
        size: props.size,
        width: props.width,
        indeterminate: true,
        color: props.loaderColor,
      },
    ];
  }

  const items = props.value.filter((loader) => loader.value >= 0.01 || loader.loading);
  if (items.length <= 0) {
    return [
      {
        key: '__placeholder',
        size: props.size,
        width: props.width,
        modelValue: 0,
        color: props.loaderColor,
      },
    ];
  }

  let total = 0;
  return items.map(
    (loader) => {
      const item = {
        size: props.size,
        width: props.width,
        key: loader.key,
        color: loader.color,
        label: loader.label,
        modelValue: loader.value * 100,
        rotate: -90 + (total * 360),
      };
      total += loader.value;
      return item;
    },
  );
});

const labelsToShow = computed(() => {
  const labels = new Set(props.labels || loaders.value.map((loader) => loader.key));

  let total = 0;
  const items = loaders.value
    .filter((loader) => labels.has(loader.key))
    .map((loader) => {
      const item = {
        key: loader.key,
        value: loader.label || loader.value,
        color: loader.color,
      };
      total += loader.value;
      return item;
    });

  if (props.showEmpty && !props.loading) {
    items.push({
      key: '__empty',
      value: 100 - total,
      color: 'grey',
    });
  }

  return items;
});
</script>

<style lang="scss" scoped>
.progress-container {
  position: relative;

  & > * {
    position: absolute;
    top: 0;
    left: 0;
  }
}

.label-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}
</style>
